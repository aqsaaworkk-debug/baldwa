'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion, useNearViewport } from '@/lib/dom';
import { REAL_WORK, REAL_WORK_VIDEO } from '@/data/realwork';

// Real work (client, 2026-11-23; full width 2026-11-24): an eyebrow and "Real work" heading styled like the other sections, then the site film and the site photos together in one compact grid.
// The film is the large tile; the photos sit beside and under it. The studio introduction (HomeIntro) that used to sit
// beside the founder photo was taken out on request; it will be placed elsewhere later.

// Photos after the first two run three to a row; a short last row is widened so the grid ends square
// (one photo left: full width; two left: half each). On small screens (two columns) an odd last photo goes full width.
const lastRow = (i: number) => {
  const n = REAL_WORK.length, rest = n - 2, short = rest % 3, odd = n % 2 === 1 && i === n - 1 ? ' rw-odd-last' : '';
  if (i < 2 || short === 0 || i < n - short) return odd;
  return (short === 1 ? ' rw-row-full' : ' rw-row-half') + odd;
};

/* eslint-disable @next/next/no-img-element */
export default function RealWork() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const near = useNearViewport(root);

  // The film loads only once the section is close, and plays only while it is on screen (muted, looping).
  useGSAP(() => {
    const v = video.current;
    if (!near || !v) return;
    if (prefersReducedMotion()) { v.controls = true; v.preload = 'metadata'; v.load(); return; } // poster + controls, no autoplay
    v.preload = 'auto';
    v.load();
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => { }); else v.pause(); }, { threshold: .15 });
    io.observe(v);
    return () => { io.disconnect(); v.pause(); };
  }, { scope: root, dependencies: [near] });

  // Each tile opens from the bottom as it comes into view; the photo or film drifts slightly inside its frame.
  useGSAP(() => {
    if (!near || prefersReducedMotion()) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 0px)', () => {
      gsap.utils.toArray<HTMLElement>('.rw-frame').forEach((f, i) => {
        gsap.fromTo(f, { clipPath: 'inset(100% 0% 0% 0% round 18px)' }, {
          clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.3, ease: 'expo.out', delay: (i % 3) * .08,
          scrollTrigger: { trigger: f, start: 'top 90%', once: true },
        });
        const media = f.querySelector('img, video');
        if (media) gsap.fromTo(media, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [near] });

  return (
    <section id="real-work" className="rw gut" ref={root} aria-labelledby="rw-title">
      {/* Faded line sketch (client, 2026-11-24) filling the gap between Process and this section; it sits behind everything */}
      <img className="rw-sketch" src="/images/process-to-site-sketch.webp" alt="" aria-hidden="true" width={1737} height={441} loading="lazy" decoding="async" />
      <div className="rw-head rv">
        <h2 className="eyebrow sec-label" id="rw-title">On site</h2>
      </div>
      <div className="rw-grid">
        <figure className="rw-item rw-film">
          <div className="rw-frame">
            <video ref={video} src={REAL_WORK_VIDEO.src} poster={REAL_WORK_VIDEO.poster} muted loop playsInline preload="none"
              aria-label={REAL_WORK_VIDEO.label} />
          </div>
        </figure>
        {REAL_WORK.map((it, i) => (
          <figure key={it.src ?? i} className={`rw-item rw-photo rw-photo-${i + 1}${lastRow(i)}`}>
            <div className={`rw-frame${it.src ? '' : ' empty'}`}>
              {it.src
                ? <img src={it.src} alt={it.alt} loading="lazy" decoding="async" style={it.focus ? { objectPosition: it.focus } : undefined} />
                : <span className="rw-ph" aria-hidden="true">Photo · {it.kind}</span>}
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
