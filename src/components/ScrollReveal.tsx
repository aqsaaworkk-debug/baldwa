'use client';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/dom';

// Any element with class "rv" slides up into place when it scrolls into view.
// Content stays fully visible the whole time (transform only, no fading from 0).
export default function ScrollReveal() {
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const els = gsap.utils.toArray<HTMLElement>('.rv');
    gsap.set(els, { y: 40 });
    ScrollTrigger.batch(els, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, duration: 1.2, ease: 'expo.out', stagger: .08, overwrite: true }),
    });
  });
  return null;
}
