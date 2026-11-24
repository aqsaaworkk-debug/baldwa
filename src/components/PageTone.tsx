'use client';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';

// The page canvas changes colour with scroll, after the reference recording. Each section keeps one colour throughout and
// the change happens only at the boundary into the next one:
//   almond   up to and through Why Baldwa
//   PHILO    Our Professional services (set while Why Baldwa's film still covers the screen, so it slides in already coloured)
//   SMOKE    from the section after the notebook (FAQ) through Contact; changes as that section comes in, as before
//   DEEP     the footer (changes as the footer comes in)
// The colour lives in --page-bg (base.css), so every section and the page behind them change together.
// Over these tones the text sitting on the canvas turns light: html.tone-light (styles in the section files).
// PHILO was a pale grey-blue (#aab3b8) that sat too close to the sky-grey cards and looked dull (client, 2026-11-24): it is now
// the blue smoke, with almond pages on it (philosophy.css).
const ALMOND = '#f2ede7', PHILO = '#748795', SMOKE = '#748795', DEEP = '#1c2836';

export default function PageTone() {
  useGSAP(() => {
    const html = document.documentElement;
    const philo = document.getElementById('services'), foot = document.querySelector('footer');
    const after = philo?.nextElementSibling as HTMLElement | null; // the section right after the notebook (the FAQ)
    if (!philo || !after || !foot) return;
    html.style.setProperty('--page-bg', ALMOND);
    html.classList.add('tone-run');
    const ahead = () => Math.round(window.innerHeight * 0.6);

    gsap.fromTo(html, { '--page-bg': ALMOND }, {
      '--page-bg': PHILO, ease: 'none',
      scrollTrigger: { trigger: philo, start: () => `top bottom+=${ahead()}`, end: 'top bottom', scrub: true, invalidateOnRefresh: true },
    });
    gsap.fromTo(html, { '--page-bg': PHILO }, {
      '--page-bg': SMOKE, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: after, start: 'top bottom', end: 'top 55%', scrub: true },
    });
    gsap.fromTo(html, { '--page-bg': SMOKE }, {
      '--page-bg': DEEP, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: foot, start: 'top bottom', end: 'top 55%', scrub: true },
    });
    // light text from the moment the canvas leaves almond (still under the film, so the switch is never seen)
    const light = ScrollTrigger.create({
      trigger: philo, start: () => `top bottom+=${ahead()}`, invalidateOnRefresh: true,
      onEnter: () => html.classList.add('tone-light'), onLeaveBack: () => html.classList.remove('tone-light'),
    });

    return () => { light.kill(); html.classList.remove('tone-light', 'tone-run'); html.style.removeProperty('--page-bg'); };
  });
  return null;
}
