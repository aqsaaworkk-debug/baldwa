'use client';
import { useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion, scrollToSection } from '@/lib/dom';
import Logo from './Logo';

// Logo builds itself in the centre, holds, then flies into the header (#brand).
// The html classes intro-on / intro-lock / brand-wait are set before paint by the
// inline script in layout.tsx and cleared here.
const HOLD = 2.05; // seconds before the logo flies to the header

export default function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(() => {
    const html = document.documentElement;
    const finish = () => {
      html.classList.remove('intro-on', 'brand-wait', 'intro-lock');
      setDone(true);
    };
    if (prefersReducedMotion()) { finish(); return; }
    // Arriving at a section from another page (e.g. /#contact from "Start a project"): no intro, go straight there
    // once the scroll-driven sections have laid out.
    if (location.hash.length > 1) {
      finish();
      const id = decodeURIComponent(location.hash.slice(1));
      setTimeout(() => scrollToSection(id), 450);
      return;
    }

    const fly = () => {
      const target = document.querySelector('#brand svg');
      if (!mark.current || !target) { finish(); return; }
      const from = mark.current.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      html.classList.remove('intro-on'); // reveals the hero frame + headline (CSS transitions)
      gsap.timeline({ onComplete: finish })
        .to(mark.current, {
          x: to.left - from.left, y: to.top - from.top, scale: to.width / from.width,
          transformOrigin: '0 0', duration: 1.05, ease: 'power4.inOut',
        })
        .to(root.current, { backgroundColor: 'rgba(255,255,255,0)', duration: .9, ease: 'power2.inOut' }, 0);
    };

    gsap.timeline()
      .from('.m-p', { y: 90, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07 })
      .from('.m-sun', { y: 60, scale: .5, opacity: 0, transformOrigin: '50% 100%', duration: 1, ease: 'expo.out' }, .85)
      .from('.m-word', { y: 24, opacity: 0, duration: .8, ease: 'expo.out' }, 1.15)
      .call(fly, [], HOLD);
  }, { scope: root });

  if (done) return null;
  return (
    <div id="intro" ref={root} aria-hidden="true">
      <div className="intro-mark" ref={mark}><Logo id="mi" /></div>
    </div>
  );
}
