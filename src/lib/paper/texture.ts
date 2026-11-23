// The paper's face as one canvas: the paper photo, the heading and the points written on it (left-to-right reveal with a
// soft edge, a faint pencil rule under each) and the sticker. It is the paper mesh's texture, so the writing and the
// sticker bend and roll up with it. Redraws only when the reveal state changes. Tweak layout and type in config.ts.
import type { PaperConfig } from './config';
import type { PaperState } from './timeline';

export type PaperArt = { paper: HTMLImageElement; sticker: HTMLImageElement };

// The lines in writing order: the heading first, then the points. Shared with the HTML copy (PaperStory.tsx).
export function paperLines(cfg: PaperConfig) {
  const t = cfg.text;
  return [
    { text: cfg.title.text, size: cfg.title.size, y: cfg.title.y, ruleTo: cfg.title.rule.to, ruleAlpha: cfg.title.rule.alpha },
    ...cfg.points.map((p, i) => ({
      text: (cfg.numbered ? `${i + 1}. ` : '') + p, size: t.size, y: t.rows[i] ?? .4 + i * .13, ruleTo: t.rule.to, ruleAlpha: t.rule.alpha,
    })),
  ];
}

export function createPaperWriter(cfg: PaperConfig, art: PaperArt, width: number) {
  const [pw, ph] = cfg.assets.paperSize;
  const W = Math.round(width), H = Math.round(width * ph / pw);
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  // one scratch canvas for the line being written (masked with a gradient, then drawn onto the page)
  const line = document.createElement('canvas');
  const lctx = line.getContext('2d')!;
  let last = '';

  const font = (size: number) => `${cfg.text.weight} ${Math.round(size)}px "${cfg.text.font}", sans-serif`;

  function drawLine(text: string, sizeFrac: number, yFrac: number, reveal: number, ruleTo: number, ruleAlpha: number) {
    if (reveal <= 0) return;
    const size = sizeFrac * W, x = cfg.text.x * W, y = yFrac * H;
    ctx.font = font(size);
    const tw = ctx.measureText(text).width;
    // faint pencil rule under the line, drawn along with the writing
    if (ruleAlpha > 0) {
      const rx1 = ruleTo * W, ry = y + cfg.text.rule.below * H * (sizeFrac / cfg.text.size) ** .5;
      ctx.save();
      ctx.globalAlpha = ruleAlpha;
      ctx.strokeStyle = cfg.text.ink;
      ctx.lineWidth = Math.max(1, W * .0014);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, ry);
      ctx.lineTo(x + (rx1 - x) * Math.min(1, reveal * 1.15), ry + (rx1 - x) * .004);
      ctx.stroke();
      ctx.restore();
    }
    if (reveal >= 1) { ctx.fillStyle = cfg.text.ink; ctx.fillText(text, x, y); return; }
    // write the line on the scratch canvas, then keep only what the pen has reached (soft right edge)
    const lw = Math.ceil(tw + size), lh = Math.ceil(size * 1.6);
    if (line.width !== lw || line.height !== lh) { line.width = lw; line.height = lh; }
    lctx.clearRect(0, 0, lw, lh);
    lctx.globalCompositeOperation = 'source-over';
    lctx.font = font(size); lctx.textBaseline = 'alphabetic'; lctx.fillStyle = cfg.text.ink;
    lctx.fillText(text, 0, size * 1.15);
    const f = Math.max(1, cfg.text.feather * tw), edge = reveal * (tw + f);
    const g = lctx.createLinearGradient(edge - f, 0, edge, 0);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.globalCompositeOperation = 'destination-in';
    lctx.fillStyle = g; lctx.fillRect(0, 0, lw, lh);
    ctx.drawImage(line, x, y - size * 1.15);
  }

  function draw(state: Pick<PaperState, 'write' | 'sticker'>, force = false) {
    // skip identical frames (quantised so tiny scrub jitter doesn't re-upload the texture)
    const key = state.write.map((w) => Math.round(w * 200)).join() + '|' + Math.round(state.sticker.scale * 100) + ':' + Math.round(state.sticker.rotate * 100);
    if (!force && key === last) return false;
    last = key;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(art.paper, 0, 0, W, H);
    ctx.textBaseline = 'alphabetic';
    // write[0] is the heading, write[1..] the points
    paperLines(cfg).forEach((l, i) => drawLine(l.text, l.size, l.y, state.write[i] ?? 0, l.ruleTo, l.ruleAlpha));
    // the sticker at the end of the paper
    const st = state.sticker;
    if (st.scale > 0) {
      const s = cfg.sticker.size * W;
      ctx.save();
      ctx.translate(cfg.sticker.x * W, cfg.sticker.y * H);
      ctx.rotate(st.rotate);
      ctx.scale(st.scale, st.scale);
      ctx.drawImage(art.sticker, -s / 2, -s / 2, s, s);
      ctx.restore();
    }
    return true;
  }

  return { canvas, draw, reset: () => { last = ''; } };
}
