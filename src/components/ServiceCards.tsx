'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/dom';
import { SERVICES, SERVICE_GROUPS } from '@/data/site';

// Services page (client, 2026-11-21): all services on one page, sorted into the three groups like the project categories on
// the Projects page (same tab buttons): 1 PMC and Construction Management, 2 Architecture, Interior Design and Consultancy,
// 3 BIM Engineering. The open tab shows each of its services in full on a wide curved card. The cards swing in from
// alternating sides (first from the left, then the right) as they come into view and whenever the tab changes.
// The tab follows the address (#pmc, #design, #bim), so links from elsewhere open the right one.

const pad = (n: number) => String(n).padStart(2, '0');
const KEYS = SERVICE_GROUPS.map((g) => g.key);

/* eslint-disable @next/next/no-img-element */
export default function ServiceCards() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(KEYS[0]);
  const group = SERVICE_GROUPS.find((g) => g.key === active)!;
  const items = group.slugs.map((slug) => SERVICES.find((s) => s.slug === slug)!);

  // Open the tab named in the address, now and whenever it changes (e.g. a link to /services#bim from the menu page).
  useEffect(() => {
    const fromHash = (scroll: boolean) => {
      const key = location.hash.slice(1);
      if (!KEYS.includes(key)) return;
      setActive(key);
      if (scroll) requestAnimationFrame(() => root.current?.scrollIntoView({ block: 'start' }));
    };
    fromHash(true);
    const onHash = () => fromHash(true);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const choose = (key: string) => {
    setActive(key);
    history.replaceState(null, '', `#${key}`);
  };

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.utils.toArray<HTMLElement>('.sv-card').forEach((card, i) => {
      const fromLeft = i % 2 === 0;
      // Swings in on a curve: slides from its side while turning up from the far bottom corner.
      gsap.fromTo(card,
        { xPercent: fromLeft ? -60 : 60, rotation: fromLeft ? -6 : 6, opacity: 0, transformOrigin: fromLeft ? '0% 100%' : '100% 100%' },
        { xPercent: 0, rotation: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: i * 0.12,
          scrollTrigger: { trigger: card, start: 'top 92%', toggleActions: 'play none none reverse' } });
    });
  }, { scope: root, dependencies: [active], revertOnUpdate: true });

  return (
    <section className="project-index sv-index" id="services-index" ref={root} aria-labelledby="sv-index-title">
      <div className="project-index-top">
        <div>
          <p className="eyebrow">What we do</p>
          <h2 id="sv-index-title">Explore by service</h2>
        </div>
        <nav className="project-filters" aria-label="Service categories">
          {SERVICE_GROUPS.map((g) => (
            <button type="button" key={g.key} className={active === g.key ? 'is-active' : undefined}
              aria-pressed={active === g.key} onClick={() => choose(g.key)}>
              {g.title}
            </button>
          ))}
        </nav>
      </div>

      <ol className="sv-list" key={active} aria-label={group.title}>
        {items.map((s, i) => (
          <li key={s.slug} className={`sv-item ${i % 2 === 0 ? 'sv-left' : 'sv-right'}`}>
            <article className="sv-card">
              <span className="sv-media"><img src={s.image.src} alt={s.image.alt} /></span>
              <div className="sv-copy">
                <span className="sv-no">{pad(i + 1)} · {s.nav}</span>
                <h3 className="sv-name">{s.h1}</h3>
                <p className="sv-text">{s.body}</p>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
