'use client';
import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/dom';
import { HOME } from '@/data/site';

// Background film. The file lives in public/videos/.
const VIDEO = '/videos/sukher-resort.mp4';

// Why Choose Baldwa and Associates? (SEO brief)
const POINTS = HOME.why.points;
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
      // the points use the track minus its last screen; during that screen Brand Philosophy slides over the pinned film
      trigger: track.current, start: 'top top', end: () => `+=${track.current!.offsetHeight - 2 * window.innerHeight}`, invalidateOnRefresh: true,
      onUpdate: ({ progress }) => {
        show(Math.min(POINTS.length - 1, Math.floor(progress * POINTS.length)));
      },
    });

    // Brand Philosophy slides up over the pinned film (why.css). The film is cut off at Philosophy's bottom edge, so where
    // Philosophy is shorter than the screen, the film never shows below it.
    const next = sec.nextElementSibling as HTMLElement | null;
    // Philosophy only paints its own (cover) colour while the film is on screen behind it (.ph-over); otherwise it stays
    // transparent, because a second painted copy of the page colour can render a shade off and show as a band.
    const clip = () => {
      const p = pin.current;
      if (!p || !next) return;
      const pr = p.getBoundingClientRect(), cut = pr.bottom - next.getBoundingClientRect().bottom;
      p.style.clipPath = cut > 0 ? `inset(0 0 ${cut}px 0)` : '';
      next.classList.toggle('ph-over', pr.bottom > 0);
    };
    const cover = next ? ScrollTrigger.create({ trigger: next, start: 'top bottom', end: 'bottom top', onUpdate: clip, onRefresh: clip, onLeave: clip, onLeaveBack: clip }) : null;

    return () => {
      st.kill(); cover?.kill(); io.disconnect(); vid.pause();
      if (pin.current) pin.current.style.clipPath = '';
      next?.classList.remove('ph-over');
      gsap.killTweensOf(list.current); gsap.set(list.current, { clearProps: 'transform' });
      sec.classList.remove('why-live');
      items.current.forEach((li) => li?.classList.remove('is-on', 'is-done'));
    };
  }, { scope: root });

  return (
    <section id="why" className="why" ref={root} aria-labelledby="why-title">
      <div className="why-track" ref={track} style={{ ['--n' as string]: POINTS.length }}>
        <div className="why-pin" ref={pin}>
          <video className="why-video" ref={video} src={VIDEO} muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />
          <div className="why-shade" aria-hidden="true" />

          {/* Heading on the left, the scrolling points on the right */}
          <div className="why-in">
            <div className="why-top">
              <p className="why-eyebrow">Why Baldwa</p>
              <h2 id="why-title">{HOME.why.h2}</h2>
            </div>
            <div className="why-col">

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
