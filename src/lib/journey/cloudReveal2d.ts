// 2D fallback for browsers without WebGL: a cloud layer that parts through a
// feathered radial mask to reveal the land beneath. Adapted from the scroll
// prototype in reference/baldwa-scroll-prototype (drawClouds in dist/journey.js).
// It only draws when asked: progress comes from the master scroll value in Journey.tsx.

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Where the clouds first thin out, as a fraction of the frame.
const EYE = { x: .5, y: .61 };

export type CloudReveal = { setProgress: (u: number) => void; resize: () => void; destroy: () => void };

export function createCloudReveal(canvas: HTMLCanvasElement, src: { sky: string; land: string }): CloudReveal | null {
  const ctx = canvas.getContext('2d', { alpha: false });
  const layer = document.createElement('canvas');
  const lctx = layer.getContext('2d');
  if (!ctx || !lctx) return null;

  let w = 0, h = 0, u = 0, alive = true;
  let sky: HTMLImageElement | null = null;
  let land: HTMLImageElement | null = null;

  // Draw an image so it always covers the frame, with a slight zoom / vertical drift.
  const cover = (to: CanvasRenderingContext2D, im: HTMLImageElement, scale: number, panY: number) => {
    const c = Math.max(w / im.naturalWidth, h / im.naturalHeight) * scale;
    const dw = im.naturalWidth * c, dh = im.naturalHeight * c;
    to.drawImage(im, (w - dw) / 2, (h - dh) / 2 + panY * h, dw, dh);
  };

  const draw = () => {
    if (!alive || !w || !h) return;
    const k = land ? u : 0; // keep the clouds closed until there is land to show
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f6f4f0';
    ctx.fillRect(0, 0, w, h);
    if (land) cover(ctx, land, lerp(1.02, 1, k), lerp(.008, 0, k));
    if (!sky || k >= 1) return;

    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, w, h);
    cover(lctx, sky, lerp(1.015, 1.035, k), -k * .008);
    if (k > 0) {
      // Punch a soft-edged, growing hole in the cloud layer.
      const radius = Math.max(w, h) * lerp(.015, 1.32, k);
      const cx = w * EYE.x, cy = h * EYE.y;
      const grad = lctx.createRadialGradient(cx, cy, radius * .3, cx, cy, radius);
      grad.addColorStop(0, `rgba(0,0,0,${smooth(0, .12, k)})`);
      grad.addColorStop(.72, `rgba(0,0,0,${smooth(.1, .68, k)})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.globalCompositeOperation = 'destination-out';
      lctx.fillStyle = grad;
      lctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1 - smooth(.78, 1, k);
    ctx.drawImage(layer, 0, 0, w, h);
    ctx.globalAlpha = 1;
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    for (const [c, x] of [[canvas, ctx], [layer, lctx]] as const) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    draw();
  };

  const load = (url: string, done: (im: HTMLImageElement) => void) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { if (alive) { done(im); draw(); } };
    im.src = url;
  };
  load(src.sky, (im) => { sky = im; });
  load(src.land, (im) => { land = im; });
  resize();

  return {
    setProgress: (v) => { const n = clamp(v); if (n !== u) { u = n; draw(); } },
    resize,
    destroy: () => { alive = false; },
  };
}
