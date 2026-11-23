'use client';
import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { projects } from '@/data/projects';
import { HOME } from '@/data/site';
import { useProjectImages } from './ProjectImages';

// Featured projects (client, 2026-11-20, after the Klickpin "garden wedding" GIF): a row of tall rounded photo panels on a
// cream canvas. One panel is open wide; the others are narrow pills with a round number badge at the foot. Scrolling opens
// them one after another, left to right. Only the project name shows (no description).
// One scroll gesture moves exactly one project (client, 2026-11-21): while the section is pinned, wheel and swipe are caught
// and each gesture glides the page to the next project's scroll position; extra momentum is ignored until the
// move is done. Past the first or last project the page scrolls on as normal. Keyboard and scrollbar still scroll freely.
//
// One number drives it: the scrubbed scroll progress v (0 to 1). Each panel's size is a pure function of v (render below),
// so scrolling back restores the same state. Desktop: panels side by side (widths). Small screens: the same accordion
// stacked vertically (heights). Reduced motion: a plain list.

const STEP = 0.85; // seconds for the glide from one project to the next
const LEAD = 0.6; // screens before the section's edge where a scroll toward it glides it in
const QUIET = 280; // ms without wheel events that ends a gesture (trackpad momentum keeps one gesture going)
const THIN = { x: 64, y: 46 }; // closed panel size (px) across the accordion axis

const pad = (n: number) => String(n).padStart(2, '0');
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/* eslint-disable @next/next/no-img-element */
export default function Projects() {
  const images = useProjectImages();
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const goTo = useRef<(i: number) => void>(() => { });
  const total = projects.length;

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add({
      wide: '(min-width: 901px) and (prefers-reduced-motion: no-preference)',
      tall: '(max-width: 900px) and (prefers-reduced-motion: no-preference)',
    }, (ctx) => {
      const { wide, tall } = ctx.conditions as { wide: boolean; tall: boolean };
      if (!wide && !tall) return;
      const axis = wide ? 'x' : 'y';
      const sec = root.current!, rw = row.current!;
      sec.classList.add('pj-acc', `pj-acc-${axis}`);
      const panels = gsap.utils.toArray<HTMLElement>('.pj-panel', rw);
      const names = panels.map((p) => p.querySelector<HTMLElement>('.pj-name'));
      const gap = () => parseFloat(getComputedStyle(rw).gap) || 0;
      let open = 0;

      const render = (v: number) => {
        const f = clamp01(v) * (total - 1); // which panel is open (fractional between two)
        const size = axis === 'x' ? rw.clientWidth : rw.clientHeight;
        const thin = THIN[axis];
        open = size - gap() * (total - 1) - thin * (total - 1); // the open panel takes all the room the thin ones leave
        panels.forEach((el, i) => {
          const w = Math.max(0, 1 - Math.abs(i - f)); // 1 = fully open; neighbours share it while one closes and one opens
          gsap.set(el, axis === 'x' ? { width: thin + (open - thin) * w } : { height: thin + (open - thin) * w });
          const n = names[i]; if (n) gsap.set(n, { opacity: clamp01((w - 0.55) / 0.45), y: (1 - clamp01((w - 0.55) / 0.45)) * 12 });
          el.classList.toggle('is-open', w > 0.5);
        });
      };

      const state = { v: 0 };
      // --pj-lead (screens, CSS): a lead-in at the top of the track before the accordion starts. The paper story sets it to 1
      // (paper-story.css): the section is already pinned at the top while its heading and panels slide in, and the track is
      // one screen taller there, so the accordion itself is unchanged. 0 everywhere else.
      const lead = () => (parseFloat(getComputedStyle(sec).getPropertyValue('--pj-lead')) || 0) * window.innerHeight;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track.current, start: () => `top+=${lead()} top`, end: 'bottom bottom', scrub: 0.25, invalidateOnRefresh: true, onRefresh: () => render(state.v),
        },
      });
      tl.to(state, { v: 1, ease: 'none', duration: 1, onUpdate: () => render(state.v) });
      render(0);

      // ---------- One project per gesture ----------
      const st = tl.scrollTrigger!;
      // Scroll position where panel i is open. The ends sit 2px inside the section: exactly on its edge would count as leaving it.
      const at = (i: number) => st.start + 2 + (st.end - st.start - 4) * (i / (total - 1));
      const pos = () => clamp01((window.scrollY - st.start) / (st.end - st.start)) * (total - 1); // fractional project index
      const nearest = () => Math.round(pos());
      const inside = () => window.scrollY >= st.start && window.scrollY <= st.end;
      // Inside the section, or heading into it with its edge less than LEAD screens away (it then glides in, so the browser's
      // own smooth wheel scroll never carries the page past the first or last project).
      const near = (dir: number) => {
        const y = window.scrollY, lead = window.innerHeight * LEAD;
        return inside() || (dir > 0 && y >= st.start - lead && y < st.start) || (dir < 0 && y > st.end && y <= st.end + lead);
      };
      const glide = { y: 0 };
      let lockedUntil = 0;
      const scrollTo = (y: number) => {
        glide.y = window.scrollY;
        lockedUntil = performance.now() + STEP * 1000;
        gsap.to(glide, {
          y, duration: STEP, ease: 'power2.inOut', overwrite: true,
          onUpdate: () => window.scrollTo({ top: glide.y, behavior: 'instant' })
        });
      };
      // A gesture is a run of wheel events with no pause longer than QUIET (trackpad momentum stays one gesture), or one touch.
      let gesture = 0, used = -1, passed = -1, lastWheel = -1e9, touchY = 0, engaged = false;
      // Returns true when the event should be blocked.
      const handle = (dir: number) => {
        if (!near(dir)) { if (!inside()) engaged = false; return false; }
        if (passed === gesture) return false;
        if (!engaged) {
          // Coming in: settle on the first project (from above) or the last (from below). The gesture that brought us in is
          // used up, so its momentum doesn't step on as well.
          engaged = true; used = gesture;
          const y = window.scrollY;
          scrollTo(at(y < st.start ? 0 : y > st.end ? total - 1 : dir > 0 ? Math.floor(pos()) : Math.ceil(pos())));
          return true;
        }
        const i = nearest();
        const gliding = performance.now() < lockedUntil;
        // A fresh gesture heading out past the first or last project scrolls the page on as normal.
        if (!gliding && used !== gesture && ((dir > 0 && i === total - 1) || (dir < 0 && i === 0))) { passed = gesture; return false; }
        if (!gliding && used !== gesture) { used = gesture; scrollTo(at(i + dir)); }
        return true;
      };
      const onWheel = (e: WheelEvent) => {
        if (Math.abs(e.deltaY) < 1) return;
        if (e.timeStamp - lastWheel > QUIET) gesture++;
        lastWheel = e.timeStamp;
        if (handle(Math.sign(e.deltaY)) && e.cancelable) e.preventDefault();
      };
      const onTouchStart = (e: TouchEvent) => { gesture++; touchY = e.touches[0]?.clientY ?? 0; };
      const onTouchMove = (e: TouchEvent) => {
        const dy = touchY - (e.touches[0]?.clientY ?? touchY);
        if (Math.abs(dy) < 8) { if (inside() && passed !== gesture && e.cancelable) e.preventDefault(); return; }
        if (handle(Math.sign(dy)) && e.cancelable) e.preventDefault(); // swipe up = next project
      };
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });

      // Clicking a closed panel glides to it.
      goTo.current = (i: number) => scrollTo(at(i));
      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        sec.classList.remove('pj-acc', `pj-acc-${axis}`);
        gsap.set([...panels, ...names.filter(Boolean) as HTMLElement[]], { clearProps: 'all' });
        panels.forEach((p) => p.classList.remove('is-open'));
        goTo.current = () => { };
        gsap.killTweensOf(glide);
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
      };
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section id="projects" className="work gut" ref={root} aria-labelledby="pj-title">
      <div className="pj-track" ref={track} style={{ ['--pj-n' as string]: total }}>
        <div className="pj-pin">
          <div className="pj-head">
            <p className="eyebrow">Featured projects</p>
            <h2 id="pj-title">{HOME.thoughtful.h2}</h2>
          </div>
          <div className="pj-row" ref={row}>
            {projects.map((q, i) => (
              <button key={q.name} type="button" className="pj-panel" onClick={() => goTo.current(i)} aria-label={q.name}>
                <span className={`pj-art${images[i] ? '' : ' img-wait'}`}>
                  {images[i] && <img src={images[i]!} alt={q.image ? q.name : `Rendering of ${q.name}`} />}
                </span>
                <span className="pj-foot" aria-hidden="true">
                  <span className="pj-badge">{pad(i + 1)}</span>
                  <span className="pj-name">{q.name}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}