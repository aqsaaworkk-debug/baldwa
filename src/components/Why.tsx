'use client';
import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/dom';

// Background film. The file lives in public/videos/.
const VIDEO = '/videos/sukher-resort.mp4';

// PLACEHOLDER COPY: adjust to what the studio actually offers.
const POINTS = [
  { title: 'Design and build under one roof', text: 'Architecture, interiors and site supervision handled by one accountable team.', key: 'Architecture · Interiors · Site' },
  { title: 'Climate-first planning', text: 'Orientation, shading and cross-ventilation are settled before a single facade is drawn.', key: 'Sun path · Shade · Airflow' },
  { title: 'See it before it is built', text: '3D models and walkthroughs at every stage, so decisions are made on sight.', key: '3D · Walkthroughs' },
  { title: 'Vastu-aware layouts', text: 'Planning that respects Vastu principles where you want them, without giving up light or flow.', key: 'Orientation · Zoning' },
  { title: 'Clear costs and timelines', text: 'Staged estimates and milestones agreed upfront, and updated openly as the project moves.', key: 'Estimates · Milestones' },
  { title: 'Detail through handover', text: 'Material samples, on-site mockups and a final snag list before the keys change hands.', key: 'Samples · Mockups · Snags' },
];
const two = (n: number) => String(n).padStart(2, '0');

export default function Why() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useGSAP(() => {
    const sec = root.current!, vid = video.current!;
    // Without JS or with reduced motion the section is a plain list over a still frame: every point open, nothing pinned.
    if (prefersReducedMotion()) return;

    // The film only plays while the section is on screen.
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) vid.play().catch(() => { }); else vid.pause();
    }, { threshold: 0.05 });
    io.observe(sec);

    // Pinned full-screen stage: scroll progress through the tall track picks the active point.
    sec.classList.add('why-live');
    let current = -1;
    const show = (i: number) => {
      if (i === current) return;
      current = i;
      items.current.forEach((li, k) => {
        li?.classList.toggle('is-on', k === i);
        li?.classList.toggle('is-done', k < i);
      });
      // Slide the list up so the active point sits at the top of the column; earlier points leave upwards.
      const li = items.current[i];
      if (li) gsap.to(list.current, { y: -li.offsetTop, duration: 1, ease: 'power3.out', overwrite: true });
    };
    show(0);
    const st = ScrollTrigger.create({
      onRefresh: () => { const li = items.current[current]; if (li) gsap.set(list.current, { y: -li.offsetTop }); },
      trigger: track.current, start: () => `top top+=${parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--head')) || 76}`, end: 'bottom bottom', invalidateOnRefresh: true,
      onUpdate: ({ progress }) => {
        show(Math.min(POINTS.length - 1, Math.floor(progress * POINTS.length)));
      },
    });

    return () => {
      st.kill(); io.disconnect(); vid.pause();
      gsap.killTweensOf(list.current); gsap.set(list.current, { clearProps: 'transform' });
      sec.classList.remove('why-live');
      items.current.forEach((li) => li?.classList.remove('is-on', 'is-done'));
    };
  }, { scope: root });

  return (
    <section id="why" className="why" ref={root} aria-labelledby="why-title">
      <div className="why-track" ref={track} style={{ ['--n' as string]: POINTS.length }}>
        {/* Small white curve in the top-left corner, continuing the Process section above. It lies over the film and scrolls away. */}
        <svg className="why-edge" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 0H700C470 4 190 34 0 120Z" />
        </svg>
        <div className="why-pin" ref={pin}>
          <video className="why-video" ref={video} src={VIDEO} muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />
          <div className="why-shade" aria-hidden="true" />

          <div className="why-in">
            <div className="why-col">
              <div className="why-top">
                <p className="why-eyebrow">Why Baldwa</p>
                <h2 id="why-title">One studio, from the first sketch to the last tile.</h2>
              </div>

              <div className="why-view">
                <ol className="why-points" ref={list}>
                  {POINTS.map((p, i) => (
                    <li key={p.title} ref={(el) => { items.current[i] = el; }}>
                      <span className="why-num">{two(i + 1)}</span>
                      <h3>{p.title}</h3>
                      <p>{p.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
