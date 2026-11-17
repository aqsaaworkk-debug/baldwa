'use client';
import { useRef } from 'react';
import { ScrollTrigger, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/dom';

// Wrap a word in *asterisks* to make it gold italic.
const MANIFESTO = 'Every building we draw begins with the *sun.* Where it rises, where it sets and how it falls across a room decide the plan before anything else.';
const WORDS = MANIFESTO.split(/\s+/).map((w) => ({ text: w.replace(/\*/g, ''), gold: w.startsWith('*') }));

const RAYS = Array.from({ length: 24 }, (_, i) => {
  const a = (i * 15 * Math.PI) / 180, w = .06, r1 = 112, r2 = i % 2 ? 170 : 196;
  const p = [[r2 * Math.cos(a), r2 * Math.sin(a)], [r1 * Math.cos(a + w), r1 * Math.sin(a + w)], [r1 * Math.cos(a - w), r1 * Math.sin(a - w)]];
  return 'M' + p.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L') + 'Z';
});

<<<<<<< Updated upstream
const PILLARS = [
  { n: 'I · Light', title: 'Light first', text: 'Rooms are placed along the sun path, so mornings, afternoons and evenings each have a room that suits them.' },
  { n: 'II · Shade', title: 'Shade as craft', text: 'Deep overhangs, screens and courtyards keep interiors cool and turn harsh daylight into soft patterns.' },
  { n: 'III · Permanence', title: 'Built to last', text: 'Stone, lime and timber chosen to age well, with details that are honest about how they are made.' },
];

export default function Philosophy() {
  const root = useRef<HTMLElement>(null);
  const sun = useRef<HTMLDivElement>(null);
=======
// Three ideas, one per diary page.
const PILLARS = [
  { title: 'Light first', text: 'Rooms are placed along the sun path, so mornings, afternoons and evenings each have a room that suits them.' },
  { title: 'Shade as craft', text: 'Deep overhangs, screens and courtyards keep interiors cool and turn harsh daylight into soft patterns.' },
  { title: 'Built to last', text: 'Stone, lime and timber chosen to age well, with details that are honest about how they are made.' },
];

// The three ideas as diary pages, in screen order (left, centre, right). They open right first, then left, then the centre fills in,
// so the reading order while scrolling is still Light, Shade, Built to last.
const PAGES = [
  { side: 'side-l', ...PILLARS[1] },
  { side: 'mid', ...PILLARS[2] },
  { side: 'side-r', ...PILLARS[0] },
];

// The client's sun film (buildings orbiting the sun). The poster is its first frame, shown until it plays and under reduced motion.
const FILM = { src: '/videos/philosophy-sun.mp4', poster: '/images/philosophy-sun.webp' };

export default function Philosophy() {
  const root = useRef<HTMLElement>(null);
  const film = useRef<HTMLVideoElement>(null);
>>>>>>> Stashed changes

  // The sun rises behind the manifesto as the section scrolls in, lighting it word by word.
  useGSAP(() => {
<<<<<<< Updated upstream
    const words = Array.from(root.current!.querySelectorAll<HTMLElement>('.manifesto .w'));
    if (prefersReducedMotion()) { words.forEach((w) => w.classList.add('lit')); sun.current!.style.setProperty('--rise', '0'); return; }
=======
    const sec = root.current!, video = film.current!;
    const words = Array.from(sec.querySelectorAll<HTMLElement>('.ph-title .w'));

    if (prefersReducedMotion()) {
      words.forEach((w) => w.classList.add('lit'));
      return; // the film stays on its poster frame
    }

    // The film loads and plays only while the section is near the screen.
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { rootMargin: '200px 0px' });
    io.observe(sec);

    // The headline lights up word by word as the section scrolls in.
>>>>>>> Stashed changes
    ScrollTrigger.create({
      trigger: root.current, start: 'top bottom', end: 'top 5%', scrub: true,
      onUpdate: ({ progress }) => {
        sun.current!.style.setProperty('--rise', (1 - progress).toFixed(3));
        const lit = Math.round(Math.min(1, progress * 1.25) * words.length);
        words.forEach((w, i) => w.classList.toggle('lit', i < lit));
      },
    });
<<<<<<< Updated upstream
=======

    // The film grows into place and soft lights drift in the background.
    gsap.from('.ph-system', { scale: 0.8, opacity: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top 85%', end: 'top 25%', scrub: 0.6 } });
    gsap.utils.toArray<HTMLElement>('.ph-blob').forEach((el, i) => {
      gsap.to(el, { x: i % 2 ? -70 : 80, y: i % 2 ? 50 : -60, duration: 11 + i * 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });

    return () => { io.disconnect(); video.pause(); };
  }, { scope: root });

  // Diary: one blank page first; on scroll a page opens to the right, then one to the left, then the centre page gets its text.
  // On narrow screens the same thing happens vertically (a page opens downwards, then one upwards).
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add({ wide: '(min-width: 901px)', narrow: '(max-width: 900px)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      const { wide, reduce } = ctx.conditions as { wide: boolean; reduce: boolean };
      if (reduce) return; // everything simply stays open
      const box = root.current!.querySelector<HTMLElement>('.ph-cards')!;
      const q = gsap.utils.selector(box);
      const prop = wide ? 'rotationY' : 'rotationX';
      // Each side page is folded flat over the centre page, hinged on the edge it shares with it.
      gsap.set(q('.side-r'), { transformOrigin: wide ? '0% 50%' : '50% 0%', [prop]: wide ? -180 : 180 });
      gsap.set(q('.side-l'), { transformOrigin: wide ? '100% 50%' : '50% 100%', [prop]: wide ? 180 : -180, autoAlpha: 0 });
      gsap.set(q('.ph-card-in > *'), { autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'power1.inOut' },
        scrollTrigger: { trigger: box, start: wide ? 'top 82%' : 'top 80%', end: wide ? 'top 20%' : 'center 45%', scrub: 0.5 },
      });
      tl.to(q('.side-r'), { [prop]: 0, duration: 1 }, 0)
        .set(q('.side-r .ph-card-in > *'), { autoAlpha: 1 }, 0.5) // text appears once the page is past upright
        .set(q('.side-l'), { autoAlpha: 1 }, 1)
        .to(q('.side-l'), { [prop]: 0, duration: 1 }, 1)
        .set(q('.side-l .ph-card-in > *'), { autoAlpha: 1 }, 1.5)
        .fromTo(q('.mid .ph-card-in > *'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.14, ease: 'power2.out' }, 2);
    });
>>>>>>> Stashed changes
  }, { scope: root });

  return (
    <section id="philosophy" className="philo gut" ref={root}>
      <div className="sunwrap" aria-hidden="true">
        <div className="sun" ref={sun}>
          <svg viewBox="-200 -200 400 400">
            <defs><radialGradient id="sunGlow"><stop offset="0" stopColor="#f5b21a" stopOpacity=".28" /><stop offset="1" stopColor="#f5b21a" stopOpacity="0" /></radialGradient></defs>
            <circle r="200" fill="url(#sunGlow)" />
            <g className="rays" fill="#ef5a12" opacity=".9">{RAYS.map((d) => <path key={d} d={d} />)}</g>
            <circle r="92" fill="#ef5a12" />
          </svg>
        </div>
        <div className="horizon" />
      </div>
      <div className="wrap philo-in">
        <p className="eyebrow gold rv">Brand philosophy</p>
<<<<<<< Updated upstream
        <p className="manifesto">
=======

        <div className="ph-system" aria-hidden="true">
          <div className="ph-film">
            <video ref={film} src={FILM.src} poster={FILM.poster} width={1280} height={720} muted loop playsInline preload="none" tabIndex={-1} />
          </div>
        </div>

        <h2 className="ph-title">
>>>>>>> Stashed changes
          {WORDS.map((w, i) => <span key={i}><span className={`w${w.gold ? ' g' : ''}`}>{w.text}</span>{i < WORDS.length - 1 ? ' ' : ''}</span>)}
        </p>
        <div className="pillars">
          {PILLARS.map((p) => (
            <div key={p.title} className="pillar rv"><span className="mono">{p.n}</span><h3>{p.title}</h3><p>{p.text}</p></div>
          ))}
        </div>
      </div>
    </section>
  );
}
