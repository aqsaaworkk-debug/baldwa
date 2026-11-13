'use client';
import { useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { isDesktop, prefersReducedMotion } from '@/lib/dom';
import { projects } from '@/data/projects';
import { useProjectImages } from './ProjectImages';
import NavLink from './NavLink';

const DEPTH = [26, 40, 16, 34, 22]; // parallax strength per floating card

/* eslint-disable @next/next/no-img-element */
export default function Projects() {
  const images = useProjectImages();
  const [cur, setCur] = useState(0);
  const busy = useRef(false);
  const stage = useRef<HTMLDivElement>(null);
  const feature = useRef<HTMLDivElement>(null);
  const total = projects.length;
  const p = projects[cur];

  // Pointer parallax for the floating cards and a slight 3D tilt on the main card.
  const { contextSafe } = useGSAP(() => {
    if (prefersReducedMotion()) return;
    const floats = gsap.utils.toArray<HTMLElement>('.float');
    const qx = floats.map((el) => gsap.quickTo(el, 'x', { duration: .9, ease: 'power3.out' }));
    const qy = floats.map((el) => gsap.quickTo(el, 'y', { duration: .9, ease: 'power3.out' }));
    const qr = floats.map((el) => gsap.quickTo(el, 'rotationY', { duration: .9, ease: 'power3.out' }));
    const fx = gsap.quickTo(feature.current, 'rotationY', { duration: 1, ease: 'power3.out' });
    const fy = gsap.quickTo(feature.current, 'rotationX', { duration: 1, ease: 'power3.out' });
    gsap.set(feature.current, { transformPerspective: 1400 });
    const el = stage.current!;
    const move = (e: PointerEvent) => {
      if (!isDesktop()) return;
      const r = el.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width - .5, my = (e.clientY - r.top) / r.height - .5;
      floats.forEach((_, k) => { qx[k](-mx * DEPTH[k]); qy[k](-my * DEPTH[k]); qr[k](mx * 6); });
      fx(mx * 3); fy(-my * 3);
    };
    const leave = () => { floats.forEach((_, k) => { qx[k](0); qy[k](0); qr[k](0); }); fx(0); fy(0); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, { scope: stage });

  // Slide change: dim + zoom the image and drop the title, swap, then bring it back.
  const inFeature = (sel: string) => feature.current?.querySelectorAll(sel) ?? [];
  const show = contextSafe((i: number) => {
    if (busy.current) return;
    const next = (i + total) % total;
    if (prefersReducedMotion()) { setCur(next); return; }
    busy.current = true;
    gsap.timeline({ onComplete: () => { setCur(next); requestAnimationFrame(() => {
      gsap.timeline({ onComplete: () => { busy.current = false; } })
        .to(inFeature('.fimg'), { opacity: 1, scale: 1, duration: 1.2, ease: 'expo.out' })
        .to(inFeature('.feat-title h3'), { yPercent: 0, opacity: 1, duration: .7, ease: 'expo.out' }, 0)
        .to(feature.current, { scale: 1, duration: .9, ease: 'expo.out' }, 0);
    }); } })
      .to(inFeature('.fimg'), { opacity: .15, scale: 1.06, duration: .42, ease: 'power2.in' })
      .to(inFeature('.feat-title h3'), { yPercent: 60, opacity: 0, duration: .35, ease: 'power2.in' }, 0)
      .to(feature.current, { scale: .97, duration: .42, ease: 'power2.in' }, 0);
  });

  return (
    <section id="projects" className="work gut">
      <div className="wrap work-head rv">
        <div>
          <p className="eyebrow on-dark">Featured projects</p>
          <h2>Places we have <em>shaped</em></h2>
          <p className="lede on-dark">Homes, pavilions and workplaces planned around sun, shade and the way people actually live in them.</p>
        </div>
        <p className="work-legend">Use the arrows<br />or pick a project</p>
      </div>

      <div className="stage" ref={stage}>
        <div className="floats">
          {[0, 1, 2, 3, 4].map((k) => {
            const j = (cur + 1 + k) % total;
            if (j === cur) return null;
            return (
              <button key={k} className={`float${images[j] ? '' : ' img-wait'}`} data-slot={k} onClick={() => show(j)} aria-label={`Show ${projects[j].name}`}>
                {images[j] && <img src={images[j]!} alt="" />}
                <span className="ftag">{projects[j].name}</span>
              </button>
            );
          })}
        </div>
        <div className="feature-pos">
          <div className={`feature${images[cur] ? '' : ' img-wait'}`} ref={feature}>
            {images[cur] && <img className="fimg" src={images[cur]!} alt={p.image ? p.name : `Rendering of ${p.name}`} />}
            <div className="fshade" />
            <div className="feat-title"><h3>{p.name}</h3></div>
            <div className="feat-ctrl">
              <button onClick={() => show(cur - 1)} aria-label="Previous project">
                <svg viewBox="0 0 40 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M40 8H2M9 1L2 8l7 7" /></svg>
              </button>
              <button onClick={() => show(cur + 1)} aria-label="Next project">
                <svg viewBox="0 0 40 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M0 8h38M31 1l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="feat-count" aria-live="polite"><b>{cur + 1}</b><span>/{total}</span></div>
          </div>
        </div>
      </div>

      <div className="wrap work-meta">
        <dl>
          <dt>Project</dt><dd>{p.name}</dd>
          <dt>Type</dt><dd>{p.type}</dd>
          <dt>Location</dt><dd className={p.location.startsWith('[') ? 'ph' : undefined}>{p.location}</dd>
        </dl>
        <p>{p.text}</p>
        {p.plan && (
          <NavLink to="plan" className="btn-line">
            Walk the plan <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M0 5h20M16 1l4 4-4 4" /></svg>
          </NavLink>
        )}
      </div>
    </section>
  );
}
