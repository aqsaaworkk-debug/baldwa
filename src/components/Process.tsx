'use client';
import { useRef, useState } from 'react';
import { ScrollTrigger, useGSAP } from '@/lib/gsap';

const STEPS = [
  { title: 'Site & brief', text: 'We walk the plot with you and study its orientation, sun path, wind, soil and local bylaws, alongside how your family wants to live.', tags: ['Site visit', 'Survey', 'Brief'] },
  { title: 'Concept & massing', text: 'Volumes, courtyards and openings are arranged around light and air. You see two or three directions in 3D before we commit to one.', tags: ['Massing models', 'Sun studies'] },
  { title: 'Design development', text: 'Plans, sections, elevations, materials and interiors are resolved together, with walkthroughs at every review.', tags: ['Plans & sections', 'Material palette', 'Interiors'] },
  { title: 'Drawings & approvals', text: 'Working drawings, structural and services coordination, and the paperwork for building permissions.', tags: ['Working drawings', 'Approvals'] },
  { title: 'Build & handover', text: 'Regular site supervision through construction and finishing, then a snag list and handover when every detail is right.', tags: ['Site supervision', 'Handover'] },
];

const mono = { fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fill: 'currentColor', stroke: 'none' } as const;

// One drawing sheet per step, stacked as an exploded isometric.
const SHEETS = [
  <svg key="0" viewBox="0 0 300 300" fill="none" stroke="currentColor" strokeWidth="1.3"><g opacity=".25"><path d="M20 60H280M20 100H280M20 140H280M20 180H280M20 220H280M20 260H280M60 20V280M100 20V280M140 20V280M180 20V280M220 20V280M260 20V280" /></g><path d="M58 76L238 62L250 232L48 242Z" strokeWidth="2" /><path d="M38 214Q150 30 262 214" strokeDasharray="4 6" /><circle cx="150" cy="78" r="9" /><path d="M262 36v26M262 36l-6 10M262 36l6 10" /><text x="24" y="290" style={mono}>01 SITE · SUN PATH</text></svg>,
  <svg key="1" viewBox="0 0 300 300" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M58 76L238 62L250 232L48 242Z" opacity=".3" /><rect x="74" y="92" width="96" height="70" strokeWidth="2" /><rect x="128" y="146" width="104" height="66" strokeWidth="2" /><path d="M84 162l20-20M100 162l38-38M118 162l44-44M128 136l34-34M138 212l40-40M156 212l58-58M176 212l46-46M196 212l26-26" /><text x="24" y="290" style={mono}>02 CONCEPT · MASSING</text></svg>,
  <svg key="2" viewBox="0 0 300 300" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="56" y="62" width="190" height="170" strokeWidth="2.4" /><path d="M56 132H150M150 62V232M150 160H246M196 160V232M104 132V232" /><path d="M150 110a18 18 0 0 1 18-18M104 190a16 16 0 0 0-16 16" /><rect x="164" y="76" width="68" height="70" strokeDasharray="3 4" /><text x="24" y="290" style={mono}>03 DESIGN · PLANS</text></svg>,
  <svg key="3" viewBox="0 0 300 300" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="56" y="62" width="150" height="120" /><path d="M56 200H206M56 194v12M206 194v12M224 62V182M218 62h12M218 182h12" /><text x="116" y="216" style={mono}>{"42'-0\""}</text><rect x="180" y="226" width="96" height="50" strokeWidth="2" /><path d="M180 244H276M228 226V276" /><text x="186" y="240" style={{ ...mono, fontSize: 9 }}>A-101</text><text x="24" y="290" style={mono}>04 DRAWINGS</text></svg>,
  <svg key="4" viewBox="0 0 300 300" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M60 70H240M60 150H240M60 230H240M60 70V230M120 70V230M180 70V230M240 70V230" strokeWidth="2" /><g fill="currentColor" stroke="none">{[65, 145, 225].flatMap((y) => [55, 115, 175, 235].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="10" height="10" />))}</g><text x="24" y="290" style={mono}>05 BUILD · STRUCTURE</text></svg>,
];

export default function Process() {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLElement>(null);

  // The step crossing the middle of the screen becomes active.
  useGSAP(() => {
    Array.from(root.current!.querySelectorAll<HTMLElement>('.step')).forEach((el, i) => {
      ScrollTrigger.create({ trigger: el, start: 'top center', end: 'bottom center', onToggle: (self) => { if (self.isActive) setActive(i); } });
    });
  }, { scope: root });

  return (
    <section id="process" className="process gut" ref={root}>
      <div className="wrap">
        <div className="rv">
          <p className="eyebrow">Process</p>
          <h2 style={{ marginTop: 18, maxWidth: '14ch' }}>From an empty plot to the <em>keys</em></h2>
        </div>
        <div className="process-grid">
          <div className="stack-wrap" aria-hidden="true">
            <div className="iso">
              {SHEETS.map((svg, i) => (
                <div key={i} className={`sheet${i === active ? ' active' : ''}${i > active ? ' above' : ''}`} style={{ ['--i' as string]: i }}>{svg}</div>
              ))}
            </div>
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`step${i === active ? ' active' : ''}`} tabIndex={0}
                onClick={() => setActive(i)} onFocus={() => setActive(i)} onPointerEnter={() => setActive(i)}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <div className="tags">{s.tags.map((t) => <span key={t}>{t}</span>)}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
