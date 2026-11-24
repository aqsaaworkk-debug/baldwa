'use client';
import { gsap, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/dom';

// About page motion, kept quiet: blocks marked .ab-rv rise in as they reach the screen, and the founder portrait drifts a
// little slower than the page as the hero scrolls away. Nothing is hidden without JS or under reduced motion.
export default function AboutMotion() {
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const page = document.querySelector<HTMLElement>('.pg-about2');
    if (!page) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.ab-rv').forEach((el) => {
        gsap.from(el, { y: 36, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      });
      gsap.fromTo('.ab-portrait-frame img', { yPercent: -4, scale: 1.08 }, {
        yPercent: 4, scale: 1.08, ease: 'none',
        scrollTrigger: { trigger: '.ab-portrait', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }, page);
    return () => ctx.revert();
  });
  return null;
}
