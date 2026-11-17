'use client';
import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/dom';

// Wrap a word in *asterisks* to make it gold.
const HEADLINE = 'Every building we draw begins with the *sun.*';
const WORDS = HEADLINE.split(/\s+/).map((w) => ({ text: w.replace(/\*/g, ''), gold: w.startsWith('*') }));

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

  useGSAP(() => {
    const sec = root.current!, video = film.current!;
    const words = Array.from(sec.querySelectorAll<HTMLElement>('.ph-title .w'));

    if (prefersReducedMotion()) {
      words.forEach((w) => w.classList.add('lit'));
      return; // the film stays on its poster frame
    }

    // The film loads and plays only while the section is near the screen.
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) video.play().catch(() => { });
      else video.pause();
    }, { rootMargin: '200px 0px' });
    io.observe(sec);

    // The headline lights up word by word as the section scrolls in.
    ScrollTrigger.create({
      trigger: sec.querySelector('.ph-title'), start: 'top 88%', end: 'top 42%', scrub: true,
      onUpdate: ({ progress }) => {
        const lit = Math.round(progress * words.length);
        words.forEach((w, i) => w.classList.toggle('lit', i < lit));
      },
    });

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
  }, { scope: root });

  return (
    <section id="philosophy" className="philo gut" ref={root}>
      <svg className="ph-edge ph-edge-top" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 0H1440V44C1180 112 900 20 620 60C380 94 180 110 0 52Z" />
      </svg>
      <span className="ph-blob b1" aria-hidden="true" />
      <span className="ph-blob b2" aria-hidden="true" />

      <div className="wrap philo-in">
        <p className="eyebrow gold rv">Brand philosophy</p>

        <div className="ph-system" aria-hidden="true">
          <div className="ph-film">
            <video ref={film} src={FILM.src} poster={FILM.poster} width={1280} height={720} muted loop playsInline preload="none" tabIndex={-1} />
          </div>
        </div>

        <h2 className="ph-title">
          {WORDS.map((w, i) => <span key={i}><span className={`w${w.gold ? ' g' : ''}`}>{w.text}</span>{i < WORDS.length - 1 ? ' ' : ''}</span>)}
        </h2>
        <p className="ph-lede rv">Where it rises, where it sets and how it falls across a room decide the plan before anything else.</p>

        <div className="ph-cards">
          {PAGES.map((p) => (
            <div key={p.title} className={`ph-card ${p.side}`}>
              <div className="ph-card-in">
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            </div>
          ))}
          {/* Binder rings on the two hinges */}
          {['a1', 'a2', 'b1', 'b2'].map((c) => <span key={c} className={`ph-link ${c}`} aria-hidden="true" />)}
        </div>
      </div>

      <svg className="ph-edge ph-edge-bottom" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 120H1440V58C1200 14 980 96 700 84C440 72 240 16 0 62Z" />
      </svg>
    </section>
  );
}
