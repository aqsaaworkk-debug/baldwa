'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/dom';
import { HOME, SERVICE_GROUPS, groupLinks } from '@/data/site';

// Our Professional services (SEO brief): the headline, then the three service groups as notebook pages (client, 2026-11-21:
// 1 PMC and construction management, 2 architecture, interior design and consultancy, 3 BIM engineering).
// Wrap a word in *asterisks* to make it gold.
const HEADLINE = 'Our Professional *services*';
const WORDS = HEADLINE.split(/\s+/).map((w) => ({ text: w.replace(/\*/g, ''), gold: w.startsWith('*') }));

// The pages in screen order, numbered left to right: 01 left, 02 centre, 03 right. They open in that reading order
// (client, 2026-11-21): the left page (01) first, then the right page (03), then the centre (02) fills in.
const SIDES = ['side-l', 'mid', 'side-r'];
const PAGES = SERVICE_GROUPS.map((g, i) => ({ side: SIDES[i], no: String(i + 1).padStart(2, '0'), title: g.title, text: g.text, links: groupLinks(g) }));

export default function Philosophy() {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
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
  }, { scope: root });

  // Diary: one blank page first; on scroll a page opens to the left, then one to the right, then the centre page gets its text.
  // On narrow screens the same thing happens vertically (a page opens upwards, then one downwards).
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add({ wide: '(min-width: 901px)', narrow: '(max-width: 900px)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      const { wide, reduce } = ctx.conditions as { wide: boolean; reduce: boolean };
      if (reduce) return; // everything simply stays open
      const box = root.current!.querySelector<HTMLElement>('.ph-cards')!;
      const q = gsap.utils.selector(box);
      const prop = wide ? 'rotationY' : 'rotationX';
      // Each side page is folded flat over the centre page, hinged on the edge it shares with it.
      // The left page lies on top and opens first; the right page stays hidden underneath until its turn.
      gsap.set(q('.side-l'), { transformOrigin: wide ? '100% 50%' : '50% 100%', [prop]: wide ? 180 : -180 });
      gsap.set(q('.side-r'), { transformOrigin: wide ? '0% 50%' : '50% 0%', [prop]: wide ? -180 : 180, autoAlpha: 0 });
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
      tl.to(q('.side-l'), { [prop]: 0, duration: 1 }, 0)
        .set(q('.side-l .ph-card-in > *'), { autoAlpha: 1 }, 0.5) // text appears once the page is past upright
        .set(q('.side-r'), { autoAlpha: 1 }, 1)
        .to(q('.side-r'), { [prop]: 0, duration: 1 }, 1)
        .set(q('.side-r .ph-card-in > *'), { autoAlpha: 1 }, 1.5)
        .fromTo(q('.mid .ph-card-in > *'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.14, ease: 'power2.out' }, 2)
        .to({}, { duration: wide ? 0.9 : 0 }); // the extra scroll: all three pages read, the notebook holds
    });
  }, { scope: root });

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
            <div key={p.title} className={`ph-card ${p.side}`}>
              <div className="ph-card-in">
                <span className="ph-no">{p.no}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <span className="ph-links">
                  {p.links.map((l) => <Link key={l.href} className="ph-more" href={l.href}>{l.label} <span aria-hidden="true">→</span></Link>)}
                </span>
              </div>
            </div>
          ))}
          {/* Binder rings on the two hinges */}
          {['a1', 'a2', 'b1', 'b2'].map((c) => <span key={c} className={`ph-link ${c}`} aria-hidden="true" />)}
        </div>
      </div>

    </section>
  );
}
