'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/dom';
import { REAL_WORK } from '@/data/realwork';

// Real work: a quiet three-column collage of site photos (construction, the founder, the people who build).
// Motion, all light: each frame reveals upward as it enters, the photo drifts a little inside its frame,
// and the middle column travels at a slightly different speed so the collage has depth.
// Photos are set in src/data/realwork.ts; empty slots show a labelled placeholder frame.
const COLS = [1, 2, 3] as const;

/* eslint-disable @next/next/no-img-element */
export default function RealWork() {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 0px)', () => {
      gsap.utils.toArray<HTMLElement>('.rw-frame').forEach((f) => {
        gsap.fromTo(f, { clipPath: 'inset(100% 0% 0% 0% round 18px)' }, {
          clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.4, ease: 'expo.out',
          scrollTrigger: { trigger: f, start: 'top 90%', once: true },
        });
        const img = f.querySelector('img');
        if (img) gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });
    // depth: the columns drift at different speeds (wide screens only, where they sit side by side)
    mm.add('(min-width: 901px)', () => {
      gsap.utils.toArray<HTMLElement>('.rw-col').forEach((c) => {
        const s = Number(c.dataset.speed) || 0;
        gsap.fromTo(c, { y: 60 * s }, { y: -60 * s, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section id="real-work" className="rw gut" ref={root} aria-labelledby="rw-title">
      <div className="wrap">
        <div className="rw-head">
          <div>
            <p className="eyebrow rv">Real work</p>
            <h2 id="rw-title" className="rv">On site, with the people who build it</h2>
          </div>
          <p className="lede rv">From initial 3D modelling to final implementation, we focus on long-lasting structural integrity and refined aesthetics.</p>
        </div>

        <div className="rw-grid">
          {COLS.map((col) => (
            <div key={col} className={`rw-col c${col}`} data-speed={col === 2 ? 1 : col === 3 ? .4 : 0}>
              {REAL_WORK.map((it, i) => it.col !== col ? null : (
                <figure key={i} className="rw-item">
                  <div className={`rw-frame ${it.shape}${it.src ? '' : ' empty'}`}>
                    {it.src
                      ? <img src={it.src} alt={it.alt} loading="lazy" />
                      : <span className="rw-ph" aria-hidden="true">Photo · {it.kind}</span>}
                  </div>
                  <figcaption><span>{String(i + 1).padStart(2, '0')} · {it.kind}</span>{it.caption}</figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
