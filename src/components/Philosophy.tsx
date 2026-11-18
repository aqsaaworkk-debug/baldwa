'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion, useNearViewport } from '@/lib/dom';
import { HOME, SERVICES, servicePath } from '@/data/site';

// Our Professional services (SEO brief): the headline, then the three services the brief lists on the homepage as notebook pages.
// Wrap a word in *asterisks* to make it gold.
const HEADLINE = 'Our Professional *services*';
const WORDS = HEADLINE.split(/\s+/).map((w) => ({ text: w.replace(/\*/g, ''), gold: w.startsWith('*') }));

const ON_HOME = SERVICES.filter((s) => s.home);   // Architecture, Interior Designing, BIM Engineering
const MORE = SERVICES.filter((s) => !s.home);     // Architectural Consultancy, PMC: linked under the notebook
const pillar = (slug: string) => { const s = ON_HOME.find((x) => x.slug === slug)!; return { ...s.home!, href: servicePath(s), nav: s.nav }; };

// The pages in screen order (left, centre, right). They open right first, then left, then the centre fills in,
// so the reading order while scrolling follows the brief: Architecture, BIM Engineering, Interior Designing.
const PAGES = [
  { side: 'side-l', ...pillar('bim-engineering') },
  { side: 'mid', ...pillar('interior-design') },
  { side: 'side-r', ...pillar('architecture') },
];

export default function Philosophy() {
  const root = useRef<HTMLElement>(null);
  const near = useNearViewport(root);

  useGSAP(() => {
    if (!near) return;
    const sec = root.current!;
    const words = Array.from(sec.querySelectorAll<HTMLElement>('.ph-title .w'));

    if (prefersReducedMotion()) {
      words.forEach((w) => w.classList.add('lit'));
      return;
    }

    // The headline lights up word by word as the section scrolls in.
    ScrollTrigger.create({
      trigger: sec.querySelector('.ph-title'), start: 'top 88%', end: 'top 42%', scrub: true,
      onUpdate: ({ progress }) => {
        const lit = Math.round(progress * words.length);
        words.forEach((w, i) => w.classList.toggle('lit', i < lit));
      },
    });
  }, { scope: root, dependencies: [near] });

  // Diary: one blank page first; on scroll a page opens to the right, then one to the left, then the centre page gets its text.
  // On narrow screens the same thing happens vertically (a page opens downwards, then one upwards).
  useGSAP(() => {
    if (!near) return;
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

      // Wide screens: the heading and notebook pin in the middle of the screen while the pages open and the last text fills in, then
      // holds for one more scroll before the page moves on. Narrow screens (pages stacked) play it in place, unpinned.
      const block = root.current!.querySelector<HTMLElement>('.philo-in')!; // heading + notebook, pinned together
      const tl = gsap.timeline({
        defaults: { ease: 'power1.inOut' },
        scrollTrigger: wide
          ? { trigger: block, start: 'center 52%', end: () => `+=${Math.round(window.innerHeight * 1.3)}`, scrub: 0.5, pin: block, anticipatePin: 1, invalidateOnRefresh: true }
          : { trigger: box, start: 'top 80%', end: 'center 45%', scrub: 0.5 },
      });
      tl.to(q('.side-r'), { [prop]: 0, duration: 1 }, 0)
        .set(q('.side-r .ph-card-in > *'), { autoAlpha: 1 }, 0.5) // text appears once the page is past upright
        .set(q('.side-l'), { autoAlpha: 1 }, 1)
        .to(q('.side-l'), { [prop]: 0, duration: 1 }, 1)
        .set(q('.side-l .ph-card-in > *'), { autoAlpha: 1 }, 1.5)
        .fromTo(q('.mid .ph-card-in > *'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.14, ease: 'power2.out' }, 2)
        .to({}, { duration: wide ? 0.9 : 0 }); // the extra scroll: all three pages read, the notebook holds
    });
  }, { scope: root, dependencies: [near] });

  return (
    <section id="services" className="philo gut" ref={root} aria-labelledby="services-title">
      <div className="wrap philo-in">
        {/* Eyebrow in the middle; the headline and lede run almost the full width below it */}
        <div className="ph-top">
          <p className="eyebrow rv">Services</p>
          <h2 className="ph-title" id="services-title">
            {WORDS.map((w, i) => <span key={i}><span className={`w${w.gold ? ' g' : ''}`}>{w.text}</span>{i < WORDS.length - 1 ? ' ' : ''}</span>)}
          </h2>
          <p className="ph-lede rv">{HOME.thoughtful.support}</p>
        </div>

        <div className="ph-cards">
          {PAGES.map((p) => (
            <div key={p.h3} className={`ph-card ${p.side}`}>
              <div className="ph-card-in">
                <h3>{p.h3}</h3>
                <p>{p.text}</p>
                <Link className="ph-more" href={p.href}>{p.nav} <span aria-hidden="true">→</span></Link>
              </div>
            </div>
          ))}
          {/* Binder rings on the two hinges */}
          {['a1', 'a2', 'b1', 'b2'].map((c) => <span key={c} className={`ph-link ${c}`} aria-hidden="true" />)}
        </div>
        <p className="ph-also rv">Also: {MORE.map((s, i) => <span key={s.slug}>{i > 0 && ' · '}<Link href={servicePath(s)}>{s.h1.replace(/^(Inclusive|Dedicated) /, '')}</Link></span>)}</p>
      </div>

    </section>
  );
}
