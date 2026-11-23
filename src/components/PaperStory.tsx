'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { gsap, ScrollTrigger, useGSAP, relayout } from '@/lib/gsap';
import { hasWebGL, prefersReducedMotion } from '@/lib/dom';
import { PAPER } from '@/lib/paper/config';
import { paperState, pinnedScreens, stageBounds, totalScreens, type PaperState } from '@/lib/paper/timeline';
import type { PaperScene } from '@/lib/three/paperScene';
import { paperLines } from '@/lib/paper/texture';

// Paper story (client, 2026-11-23): the bridge from the hero film to the featured projects.
// It picks up exactly where the film ends (its last frame: the palace model on the desk, a sheet of paper on the table).
//   lift   the sheet rises to the centre; the hero photo slides up half a screen and plain cream fills the lower half
//   write  the heading ("Baldwa & Associates"), then the four services, are written one by one (the sticker is on the paper
//          from the start; layout holds still)
//   away   the hero is released: it scrolls away with the sheet on it, the sheet rolling up as it goes, uncovering the
//          Projects section, which is already pinned at the top behind it; its heading and panels slide in from the right
//          (only into space the hero and paper have cleared, so nothing overlaps), then it works as before
//
// Everything sits in one sticky stage (hero photo, cream panel, paper canvas); Projects sits behind its last screen and only
// ever moves by normal scrolling: nothing is moved vertically by script, so nothing jitters when you scroll. The only script-driven
// motion outside the stage is Projects' heading and panels sliding in sideways.
// One number drives it: the progress p of this section; paperState(p) (lib/paper/timeline.ts) gives everything; stage
// lengths in lib/paper/config.ts. The section starts two screens early, under the end of the hero (journey.css): it stays
// invisible until the film has reached its last frame, then crossfades to the identical still.
// gl: three.js (lib/three/paperScene.ts). 2d: no WebGL, the paper simply slides and fades, no curl. still: reduced motion,
// one screen with all four points written, nothing moves.
type Mode = 'gl' | '2d' | 'still';
const A = PAPER.assets;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((ok, fail) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => ok(img); img.onerror = fail;
    img.src = src;
  });
}

export default function PaperStory() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => { setMode(prefersReducedMotion() ? 'still' : hasWebGL() ? 'gl' : '2d'); }, []);
  // the mode changes this section's height and Projects' lead-in (paper-story.css): re-measure the triggers
  useEffect(() => { if (mode) relayout(); }, [mode]);

  useGSAP(() => {
    if (!mode || mode === 'still' || !root.current) return;
    const sec = root.current;
    const $ = gsap.utils.selector(sec);
    const stage = $('.ps-stage')[0], hero = $('.ps-hero')[0], blur = $('.ps-bg-blur')[0], dim = $('.ps-dim')[0], panel = $('.ps-panel')[0];
    const released = stageBounds(PAPER).away[0];
    const float = $('.ps-float')[0], sheet = $('.ps-sheet')[0], texts = $('.ps-pt-text'), sticker = $('.ps-sticker')[0];
    // the Projects section right after this one, and the parts of it that slide in from the right
    const work = sec.nextElementSibling instanceof HTMLElement && sec.nextElementSibling.matches('.work') ? sec.nextElementSibling : null;
    const slide = work ? gsap.utils.toArray<HTMLElement>(work.querySelectorAll('.pj-head, .pj-row')) : [];
    const total = totalScreens(PAPER);
    let scene: PaperScene | null = null, disposed = false, p = 0;
    let trigger: ScrollTrigger | null = null;

    // 2d fallback: the same timeline on the HTML sheet (slide up from the table, write, fade as it would roll; no curl)
    const paint2d = (st: PaperState) => {
      gsap.set(sheet, { yPercent: -50 + 45 * (1 - st.lift) - 40 * st.roll, xPercent: -50, scale: (.55 + .45 * st.lift) * (1 - .3 * st.roll), opacity: Math.min(1, st.lift * 3) * (1 - st.roll) });
      // the mask runs 10% past the end so no overhanging last letter is clipped
      texts.forEach((el, i) => gsap.set(el, { clipPath: `inset(-20% ${100 - st.write[i] * 110}% -20% -5%)` }));
      gsap.set(sticker, { xPercent: -50, yPercent: -50, scale: st.sticker.scale, rotation: st.sticker.rotate * 57.3 });
    };

    const paint = () => {
      const vh = window.innerHeight;
      // scroll into the section, px (from the trigger's measured start: no layout read per frame)
      const into = trigger ? window.scrollY - trigger.start : -sec.getBoundingClientRect().top;
      const s = Math.min(total * vh, Math.max(0, into));
      p = s / (total * vh);
      const st = paperState(p, PAPER);
      gsap.set(stage, { autoAlpha: st.fade });
      gsap.set(float, { autoAlpha: p >= 1 ? 0 : st.fade });
      gsap.set(hero, { y: -st.heroShift * vh });
      // once the hero is released, Projects (same cream) is right behind the panel: drop the panel so it shows through
      gsap.set(panel, { autoAlpha: p > released ? 0 : 1 });
      gsap.set(blur, { opacity: st.backdrop * PAPER.backdrop.blur });
      gsap.set(dim, { opacity: st.backdrop * PAPER.backdrop.dim });
      if (work) {
        // Projects' heading and panels slide in from the right (they start fully off screen)
        slide.forEach((el) => {
          const t = el.matches('.pj-head') ? st.headingIn : st.projectsIn;
          gsap.set(el, { x: p >= 1 ? 0 : (1 - t) * PAPER.projectsFrom * window.innerWidth });
        });
      }
      if (mode === 'gl') scene?.setProgress(p);
      else paint2d(st);
    };

    trigger = ScrollTrigger.create({
      trigger: sec, start: 'top top', end: () => `+=${total * window.innerHeight}`, invalidateOnRefresh: true,
      onUpdate: paint, onToggle: paint,
    });
    paint();

    const mobile = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
    if (mode === 'gl') {
      (async () => {
        try {
          const [{ createPaperScene }, paper, sticker] = await Promise.all([
            import('@/lib/three/paperScene'), loadImage(A.paper), loadImage(A.sticker),
          ]);
          // the handwriting must be loaded before it is drawn onto the canvas
          await document.fonts.load(`${PAPER.text.weight} 64px ${PAPER.text.font}`).catch(() => { });
          if (disposed || !canvas.current) return;
          scene = createPaperScene(canvas.current, PAPER, { paper, sticker }, { mobile });
          scene.resize();
          paint();
          // dev: lets scroll tests and pose fitting reach the live config and scene
          if (process.env.NODE_ENV !== 'production') (window as unknown as { __paper?: object }).__paper = { cfg: PAPER, scene, paint };
        } catch { sec.classList.add('ps-nogl'); setMode('2d'); }
      })();
    }
    const ro = new ResizeObserver(() => { scene?.resize(); paint(); });
    ro.observe(float);
    relayout(); // this section changes the page height under the hero: re-measure the triggers below

    // Debug panel: D on localhost, or anywhere with ?debug
    const debugOk = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || new URLSearchParams(location.search).has('debug');
    const onKey = (e: KeyboardEvent) => {
      if (!debugOk || e.key.toLowerCase() !== 'd' || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable]')) return;
      import('@/lib/paper/debug').then(({ toggleDebug }) => toggleDebug(PAPER, {
        change: paint,
        rebuild: () => { scene?.refresh(); paint(); },
        scrub: (v) => trigger && window.scrollTo({ top: trigger.start + v * (trigger.end - trigger.start), behavior: 'instant' }),
        progress: () => p,
      }));
    };
    window.addEventListener('keydown', onKey);

    return () => {
      disposed = true;
      trigger?.kill();
      ro.disconnect();
      window.removeEventListener('keydown', onKey);
      if (slide.length) gsap.set(slide, { clearProps: 'transform' });
      scene?.dispose(); scene = null;
    };
  }, { scope: root, dependencies: [mode] });

  return (
    <section
      ref={root} className={`paper-story${mode ? ` ps-${mode}` : ''}`} aria-label="How a project comes together"
      style={{ '--ps-screens': pinnedScreens(PAPER) } as CSSProperties}
    >
      {/* One sticky stage: the hero photo (the film's last frame) with a cream panel under it, sliding up by heroShift, and
          the paper on top. Projects (after this section) scrolls over the stage's lower half and then takes over. */}
      <div className="ps-stage">
        {/* eslint-disable @next/next/no-img-element */}
        <div className="ps-hero">
          <img className="ps-bg" src={A.frame} alt="" aria-hidden="true" />
          <img className="ps-bg ps-bg-blur" src={A.frameBlur} alt="" aria-hidden="true" />
          <div className="ps-dim" aria-hidden="true" />
          <div className="ps-panel" aria-hidden="true" />
        </div>
      {/* The paper: the WebGL canvas, or the HTML sheet in the 2d and still versions. In the WebGL version the points are
          drawn on the paper texture and the HTML copy stays for screen readers only. */}
      <div className="ps-float">
        {mode === 'gl' && <canvas className="ps-canvas" ref={canvas} aria-hidden="true" />}
        <div className="ps-sheet" style={{ '--ps-ar': `${A.paperSize[0]} / ${A.paperSize[1]}`, '--ps-arn': A.paperSize[0] / A.paperSize[1], '--ps-size': PAPER.text.size, '--ps-ink': PAPER.text.ink } as CSSProperties}>
          <img className="ps-paper" src={A.paper} alt="" aria-hidden="true" />
          {/* heading, then the points: the same lines, in the same order, as on the paper texture */}
          <p className="ps-title" style={{ '--x': PAPER.text.x, '--y': PAPER.title.y, '--rule-to': PAPER.title.rule.to, '--ps-line': PAPER.title.size } as CSSProperties}>
            <span className="ps-pt-text">{paperLines(PAPER)[0].text}</span>
          </p>
          <ol className="ps-points">
            {paperLines(PAPER).slice(1).map((l, i) => (
              <li key={l.text} style={{ '--x': PAPER.text.x, '--y': PAPER.text.rows[i], '--rule-to': PAPER.text.rule.to } as CSSProperties}>
                <span className="ps-pt-text">{l.text}</span>
              </li>
            ))}
          </ol>
          <img className="ps-sticker" src={A.sticker} alt="" aria-hidden="true"
            style={{ '--sx': PAPER.sticker.x, '--sy': PAPER.sticker.y, '--ss': PAPER.sticker.size, '--sr': `${PAPER.sticker.rotate}rad` } as CSSProperties} />
        </div>
        {/* eslint-enable @next/next/no-img-element */}
      </div>
      </div>
    </section>
  );
}
