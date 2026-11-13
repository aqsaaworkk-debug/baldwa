'use client';
import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/dom';

const icon = (d: ReactNode) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{d}</svg>;

// PLACEHOLDER COPY: adjust to what the studio actually offers.
const POINTS = [
  { icon: icon(<path d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6" />), title: 'Design and build under one roof', text: 'Architecture, interiors and site supervision handled by one accountable team.', key: 'Architecture · Interiors · Site' },
  { icon: icon(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>), title: 'Climate-first planning', text: 'Orientation, shading and cross-ventilation are settled before a single facade is drawn.', key: 'Sun path · Shade · Airflow' },
  { icon: icon(<><path d="M12 2l9 5v10l-9 5-9-5V7z" /><path d="M12 22V12M21 7l-9 5-9-5" /></>), title: 'See it before it is built', text: '3D models and walkthroughs like the one above at every stage, so decisions are made on sight.', key: '3D · Walkthroughs' },
  { icon: icon(<><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>), title: 'Vastu-aware layouts', text: 'Planning that respects Vastu principles where you want them, without giving up light or flow.', key: 'Orientation · Zoning' },
  { icon: icon(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>), title: 'Clear costs and timelines', text: 'Staged estimates and milestones agreed upfront, and updated openly as the project moves.', key: 'Estimates · Milestones' },
  { icon: icon(<><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3M15 8l2 2" /></>), title: 'Detail through handover', text: 'Material samples, on-site mockups and a final snag list before the keys change hands.', key: 'Samples · Mockups · Snags' },
];

export default function Why() {
  const root = useRef<HTMLElement>(null);

  // 3D tilt + a gold glow that follows the pointer.
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.utils.toArray<HTMLElement>('.tilt').forEach((card) => {
      gsap.set(card, { transformPerspective: 900 });
      const rx = gsap.quickTo(card, 'rotationX', { duration: .5, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: .5, ease: 'power3.out' });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        rx((.5 - y) * 9); ry((x - .5) * 11);
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }, { scope: root });

  return (
    <section id="why" className="why gut" ref={root}>
      <div className="wrap">
        <div className="why-head rv">
          <div><p className="eyebrow">Why Baldwa</p><h2 style={{ marginTop: 18 }}>One studio, from the first sketch to the <em>last</em> tile</h2></div>
          <p className="lede">Fewer handoffs means fewer surprises. The people who draw your home are the people who see it built.</p>
        </div>
        <div className="why-grid">
          {POINTS.map((p) => (
            <article key={p.title} className="card tilt rv">
              <div className="ic">{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
              <span className="k">{p.key}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
