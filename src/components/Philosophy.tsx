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

const PILLARS = [
  { n: 'I · Light', title: 'Light first', text: 'Rooms are placed along the sun path, so mornings, afternoons and evenings each have a room that suits them.' },
  { n: 'II · Shade', title: 'Shade as craft', text: 'Deep overhangs, screens and courtyards keep interiors cool and turn harsh daylight into soft patterns.' },
  { n: 'III · Permanence', title: 'Built to last', text: 'Stone, lime and timber chosen to age well, with details that are honest about how they are made.' },
];

export default function Philosophy() {
  const root = useRef<HTMLElement>(null);
  const sun = useRef<HTMLDivElement>(null);

  // The sun rises behind the manifesto as the section scrolls in, lighting it word by word.
  useGSAP(() => {
    const words = Array.from(root.current!.querySelectorAll<HTMLElement>('.manifesto .w'));
    if (prefersReducedMotion()) { words.forEach((w) => w.classList.add('lit')); sun.current!.style.setProperty('--rise', '0'); return; }
    ScrollTrigger.create({
      trigger: root.current, start: 'top bottom', end: 'top 5%', scrub: true,
      onUpdate: ({ progress }) => {
        sun.current!.style.setProperty('--rise', (1 - progress).toFixed(3));
        const lit = Math.round(Math.min(1, progress * 1.25) * words.length);
        words.forEach((w, i) => w.classList.toggle('lit', i < lit));
      },
    });
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
        <p className="manifesto">
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
