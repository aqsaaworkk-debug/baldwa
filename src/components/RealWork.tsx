'use client';
import { Fragment, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion, useNearViewport } from '@/lib/dom';
import { REAL_WORK } from '@/data/realwork';
import HomeIntro from './HomeIntro';

// Full-width photo story: two site views, the studio introduction beside the portrait,
// then the team and construction photos. Copy stays on the clear page canvas.

/* eslint-disable @next/next/no-img-element */
export default function RealWork() {
  const root = useRef<HTMLElement>(null);
  const near = useNearViewport(root);

  useGSAP(() => {
    if (!near) return;
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
    return () => mm.revert();
  }, { scope: root, dependencies: [near] });

  return (
    <section id="real-work" className="rw gut" ref={root} aria-labelledby="rw-title">
      <div className="rw-in">
        <div className="rw-head">
          <div>
            <p className="eyebrow rv">Real work</p>
            <h2 id="rw-title" className="rv">On site, with the people who build it</h2>
          </div>
          <p className="lede rv">From initial 3D modelling to final implementation, we focus on long-lasting structural integrity and refined aesthetics.</p>
        </div>

        <div className="rw-grid">
          {REAL_WORK.map((it, i) => (
            <Fragment key={it.src ?? i}>
              {i === 2 && <HomeIntro />}
              <figure className={`rw-item rw-photo-${i + 1}`}>
                <div className={`rw-frame ${it.shape}${it.src ? '' : ' empty'}`}>
                  {it.src
                    ? <img src={it.src} alt={it.alt} loading="lazy" decoding="async" />
                    : <span className="rw-ph" aria-hidden="true">Photo · {it.kind}</span>}
                </div>
                <figcaption><span>{String(i + 1).padStart(2, '0')} · {it.kind}</span>{it.caption}</figcaption>
              </figure>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
