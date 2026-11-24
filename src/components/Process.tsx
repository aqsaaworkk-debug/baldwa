'use client';
import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, relayout } from '@/lib/gsap';
import { useNearViewport } from '@/lib/dom';

// Five stages along one hand-drawn route. `phase`, `text` and `tags` are the studio's existing process copy.
const STAGES = [
  { title: 'Vision', phase: 'Site & brief', text: 'Initial consultation to deeply understand your vision, lifestyle goals, and project requirements.', tags: ['Site visit', 'Survey', 'Brief'] },
  { title: 'Strategize', phase: 'Concept & massing', text: 'A delivery model, master programme and approvals map – the invisible scaffolding every successful project stands on.', tags: ['Massing models', 'Sun studies'] },
  { title: 'Design', phase: 'Design development', text: 'Architecture, interiors, structure and MEP developed together in one multidisciplinary practice – every decision cross-checked against the brief and the budget.', tags: ['Plans & sections', 'Material palette', 'Interiors'] },
  { title: 'Execute', phase: 'Drawings & approvals', text: 'BIM coordination, contractor management, weekly cost dashboards and full-time site supervision.', tags: ['Working drawings', 'Approvals'] },
  { title: 'Deliver', phase: 'Build & handover', text: 'Snag closure, FF&E, O&M manuals, warranty and a live asset model handed to the client.', tags: ['Site supervision', 'Handover'] },
];

// One illustrated step card per stage (cropped from the studio's "architectural journey" graphic, steps 1 to 5).
// The card for the latest reached stage sits on top of the deck; earlier cards tuck in behind it.
const CARDS = STAGES.map((s, i) => ({ src: `/images/process/step-${i + 1}.webp`, title: s.title }));

// Horizontal marker positions as a fraction of the road width. Must match `--x` handling in process.css.
const XS = [0.08, 0.29, 0.5, 0.71, 0.92];

type Pt = [number, number];
const r1 = (n: number) => Math.round(n * 10) / 10;

// Smooth Catmull-Rom style curve through every point, returned as one cubic segment per gap.
function segments(pts: Pt[], k = 5) {
  const out: string[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / k, p1[1] + (p2[1] - p0[1]) / k];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / k, p2[1] - (p3[1] - p1[1]) / k];
    out.push(`C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`);
  }
  return out;
}


const DEG = Math.PI / 180;
const PERSPECTIVE = 1100;  // px, for the tilted ground plane the route is drawn on
const PIN_H = 26;           // height of the marker pins standing on the route (horizontal layout)

export default function Process() {
  const root = useRef<HTMLElement>(null);
  const near = useNearViewport(root);
  const track = useRef<HTMLDivElement>(null);
  const road = useRef<HTMLDivElement>(null);
  const plane = useRef<SVGSVGElement>(null);
  const overlay = useRef<SVGSVGElement>(null);
  const grid = useRef<SVGRectElement>(null);
  const fade = useRef<SVGRectElement>(null);
  const guide = useRef<SVGPathElement>(null);
  const reveal = useRef<SVGPathElement>(null);
  const ribbon = useRef<SVGPathElement>(null);
  const edge = useRef<SVGPathElement>(null);
  const measure = useRef<SVGPathElement>(null);
  const pencil = useRef<SVGGElement>(null);
  const anchors = useRef<(SVGCircleElement | null)[]>([]);
  const pins = useRef<(SVGGElement | null)[]>([]);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const sheets = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    if (!near) return;
    const mm = gsap.matchMedia();
    mm.add({
      vertical: '(max-width: 760px)',
      horizontal: '(min-width: 761px)', // ensures the handler runs at every width (gsap only calls it when a condition matches)
      pinned: '(min-width: 1101px) and (min-height: 641px)',
      reduce: '(prefers-reduced-motion: reduce)',
    }, (ctx) => {
      const { vertical, pinned, reduce } = ctx.conditions as { vertical: boolean; pinned: boolean; reduce: boolean };
      const sec = root.current!, box = road.current!;
      const tilt = (vertical ? 16 : 34) * DEG;
      const sin = Math.sin(tilt), cos = Math.cos(tilt);
      const state = { p: reduce ? 1 : 0 };

      // Geometry from the last build: screen-space samples of the route, their plane-space arc lengths, marker thresholds.
      let S: Pt[] = [];
      let PL: number[] = [];
      let planeLen = 1;
      let marks: number[] = [];

      const build = () => {
        const W = box.clientWidth, H = box.clientHeight;
        if (!W || !H) return;
        const cx = W / 2, cy = H / 2;
        // Screen point -> point on the tilted plane (inverse of CSS perspective + rotateX around the box centre).
        const inv = ([X, Y]: Pt): Pt => {
          const yr = Y - cy;
          const u = (yr * PERSPECTIVE) / (PERSPECTIVE * cos + yr * sin);
          const s = PERSPECTIVE / (PERSPECTIVE - u * sin);
          return [cx + (X - cx) / s, cy + u];
        };

        const lis = items.current.filter(Boolean) as HTMLLIElement[];
        let anchorsXY: Pt[];
        const pts: Pt[] = [];
        const anchorIdx: number[] = [];
        if (vertical) {
          anchorsXY = lis.map((li, i) => {
            const h3 = li.querySelector('h3') as HTMLElement;
            return [i % 2 ? 42 : 22, li.offsetTop + h3.offsetTop + h3.offsetHeight / 2];
          });
          pts.push([30, Math.max(0, anchorsXY[0][1] - 56)]);
          anchorsXY.forEach((a, i) => {
            if (i) { const b = anchorsXY[i - 1]; pts.push([(a[0] + b[0]) / 2 + (i % 2 ? 9 : -9), (a[1] + b[1]) / 2]); }
            anchorIdx.push(pts.length); pts.push(a);
          });
          pts.push([30, H - 4]);
        } else {
          const ups = lis.filter((_, i) => i % 2), downs = lis.filter((_, i) => !(i % 2));
          const top = Math.max(...ups.map((li) => li.offsetTop + li.offsetHeight));
          const bottom = Math.min(...downs.map((li) => li.offsetTop));
          const hi = top + PIN_H + 10, lo = Math.max(hi + 60, bottom + 2);
          anchorsXY = XS.map((x, i) => [W * x, i % 2 ? hi : lo]);
          pts.push([0, lo + 14]);
          anchorsXY.forEach((a, i) => {
            if (i) {
              const b = anchorsXY[i - 1], dx = a[0] - b[0], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
              // Hand-drawn switchback on alternate gaps, like a pencil doubling back on itself.
              if (i % 2) pts.push([mx + dx * 0.1, my - 18], [mx - dx * 0.03, my + 1], [mx + dx * 0.13, my + 19]);
              else pts.push([mx, my + (a[1] < b[1] ? -6 : 6)]);
            }
            anchorIdx.push(pts.length); pts.push(a);
          });
          pts.push([W, hi + (lo - hi) * 0.35]);
        }

        const segs = segments(pts, 4.6);
        const start = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
        const m = measure.current!;
        m.setAttribute('d', start + segs.join(''));
        const Ls = m.getTotalLength() || 1;
        marks = anchorIdx.map((k) => {
          m.setAttribute('d', start + segs.slice(0, k).join(''));
          return m.getTotalLength() / Ls;
        });
        m.setAttribute('d', start + segs.join(''));

        // Sample the route on screen, then lift every sample onto the plane.
        const N = Math.max(80, Math.ceil(Ls / 4));
        S = []; PL = [];
        const Q: Pt[] = [];
        for (let i = 0; i <= N; i++) {
          const pt = m.getPointAtLength((Ls * i) / N);
          S.push([pt.x, pt.y]);
          Q.push(inv([pt.x, pt.y]));
          PL.push(i ? PL[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]) : 0);
        }
        planeLen = PL[N] || 1;

        // Pencil ribbon: tapered ends, pressure that swells in the bends and wavers along the straights.
        const w0 = vertical ? 3.8 : 5.2;
        const L: string[] = [], R: string[] = [];
        for (let i = 0; i <= N; i++) {
          const a = Q[Math.max(0, i - 1)], b = Q[Math.min(N, i + 1)];
          const tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
          const nx = -ty / tl, ny = tx / tl;
          const t = i / N, s = (Ls * i) / N;
          const a2 = Q[Math.max(0, i - 3)], b2 = Q[Math.min(N, i + 3)];
          const turn = Math.abs(Math.atan2(b2[1] - Q[i][1], b2[0] - Q[i][0]) - Math.atan2(Q[i][1] - a2[1], Q[i][0] - a2[0]));
          const bend = Math.min(0.55, (turn > Math.PI ? 2 * Math.PI - turn : turn) * 1.6);
          const taper = Math.pow(Math.min(1, t / 0.07), 0.8) * Math.pow(Math.min(1, (1 - t) / 0.09), 0.8);
          const press = 0.74 + 0.2 * Math.sin(s * 0.011 + 0.6) + 0.1 * Math.sin(s * 0.033) + bend;
          const hw = (w0 * taper * press) / 2;
          L.push(`${r1(Q[i][0] + nx * hw)} ${r1(Q[i][1] + ny * hw)}`);
          R.push(`${r1(Q[i][0] - nx * hw)} ${r1(Q[i][1] - ny * hw)}`);
        }
        const ribbonD = `M${L.join('L')}L${R.reverse().join('L')}Z`;
        const lineD = `M${Q.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}`;

        plane.current!.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${tilt / DEG}deg)`;
        plane.current!.setAttribute('viewBox', `0 0 ${W} ${H}`);
        overlay.current!.setAttribute('viewBox', `0 0 ${W} ${H}`);
        for (const r of [grid.current!, fade.current!]) {
          r.setAttribute("x", String(-W * 0.1)); r.setAttribute("y", "0");
          r.setAttribute("width", String(W * 1.2)); r.setAttribute("height", String(H));
        }
        ribbon.current!.setAttribute('d', ribbonD);
        edge.current!.setAttribute('d', ribbonD);
        guide.current!.setAttribute('d', lineD);
        reveal.current!.setAttribute('d', lineD);
        reveal.current!.style.strokeDasharray = `${planeLen} ${planeLen + 4}`;
        anchorsXY.forEach((a, i) => {
          const [px, py] = inv(a);
          anchors.current[i]?.setAttribute('cx', String(r1(px)));
          anchors.current[i]?.setAttribute('cy', String(r1(py)));
          pins.current[i]?.setAttribute('transform', `translate(${r1(a[0])} ${r1(a[1] + (vertical ? PIN_H : 0))})`);
        });
        apply();
      };

      // Everything is a pure function of progress, so scrolling back up reverses it exactly.
      const apply = () => {
        const p = state.p, N = S.length - 1;
        if (N < 1) return;
        const f = p * N, i = Math.min(N - 1, Math.floor(f)), fr = f - i;
        const lenNow = PL[i] + (PL[i + 1] - PL[i]) * fr;
        reveal.current!.style.strokeDashoffset = String(planeLen - lenNow);

        const x = S[i][0] + (S[i + 1][0] - S[i][0]) * fr, y = S[i][1] + (S[i + 1][1] - S[i][1]) * fr;
        const a = S[Math.max(0, i - 3)], b = S[Math.min(N, i + 3)];
        const heading = Math.atan2(b[1] - a[1], b[0] - a[0]) / DEG;
        const lean = vertical ? -28 : -40 + Math.max(-12, Math.min(12, heading * 0.2));
        const pen = pencil.current!;
        pen.setAttribute('transform', `translate(${r1(x)} ${r1(y)}) rotate(${r1(lean)})`);
        pen.style.opacity = p > 0.003 && p < 0.997 ? '1' : '0';

        let reached = 0;
        marks.forEach((mk, k) => {
          const on = p >= mk - 0.002;
          if (on) reached = k + 1;
          items.current[k]?.classList.toggle('is-on', on);
          pins.current[k]?.classList.toggle('is-on', on);
          anchors.current[k]?.classList.toggle('is-on', on);
        });
        // The card deck follows the road: the latest reached stage's card is on top, later cards wait out of sight.
        const active = Math.max(0, reached - 1);
        sheets.current.forEach((el, k) => {
          el?.classList.toggle('active', k === active);
          el?.classList.toggle('above', k > active);
          el?.style.setProperty('--d', String(Math.max(0, active - k)));
        });
      };

      sec.classList.add('pr-ready');
      if (vertical) sec.classList.add('pr-vertical');
      if (!reduce) sec.classList.add('pr-live');
      build();

      if (!reduce) {
        const tl = gsap.timeline({
          scrollTrigger: pinned
            ? { trigger: track.current, start: () => `top top+=${parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--head')) || 76}`, end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true }
            : { trigger: box, start: vertical ? 'top 70%' : 'top 78%', end: vertical ? 'bottom 70%' : 'bottom 45%', scrub: 0.6 },
        });
        tl.to(state, { p: 1, duration: 1, ease: 'none', onUpdate: apply });
        if (pinned) tl.to({}, { duration: 0.12 }); // hold the finished route briefly before the section scrolls on
      }
      // pr-live / pr-ready change the section's height after the triggers below it were measured: re-measure them.
      relayout();

      // Rebuild when fonts load, labels re-wrap or the page layout shifts.
      let raf = 0, timer = 0, lastW = box.clientWidth, lastH = box.clientHeight;
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(build);
        if (box.clientWidth !== lastW || box.clientHeight !== lastH) {
          lastW = box.clientWidth; lastH = box.clientHeight;
          clearTimeout(timer);
          timer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
        }
      });
      ro.observe(box);

      return () => {
        ro.disconnect();
        cancelAnimationFrame(raf);
        clearTimeout(timer);
        sec.classList.remove('pr-live', 'pr-ready', 'pr-vertical');
        [...items.current, ...pins.current, ...anchors.current].forEach((el) => el?.classList.remove('is-on'));
      };
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [near] });

  return (
    <section id="process" className="process gut" ref={root} aria-labelledby="process-title">
      <div className="wrap pr-head rv">
        <h2 className="eyebrow sec-label" id="process-title">Process</h2>
      </div>

      <div className="pr-track" ref={track}>
        <div className="pr-pin">
          <div className="wrap pr-layout">
            <div className="stack-wrap" aria-hidden="true">
              <div className="deck">
                {CARDS.map((c, i) => (
                  <div key={c.src} ref={(el) => { sheets.current[i] = el; }} className={`step-card${i === 0 ? ' active' : ' above'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.src} alt="" width={380} height={460} loading="lazy" decoding="async" />
                  </div>
                ))}
              </div>
            </div>

            <div className="pr-road" ref={road}>
              {/* Ground plane: tilted in 3D. Drafting grid, faint construction line, and the pencil stroke revealed by scroll. */}
              <svg className="pr-plane" ref={plane} aria-hidden="true" focusable="false">
                <defs>
                  <pattern id="pr-grid" width="44" height="44" patternUnits="userSpaceOnUse">
                    <path d="M44 0H0V44" className="pr-grid-line" />
                  </pattern>
                  <radialGradient id="pr-fade-g" cx="50%" cy="50%" r="50%">
                    <stop offset="0" stopColor="#fff" stopOpacity="1" />
                    <stop offset=".55" stopColor="#fff" stopOpacity=".55" />
                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                  </radialGradient>
                  <mask id="pr-fade"><rect ref={fade} fill="url(#pr-fade-g)" /></mask>
                  <mask id="pr-reveal" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000">
                    <path ref={reveal} className="pr-reveal" />
                  </mask>
                  <filter id="pr-pencil" x="-5%" y="-20%" width="110%" height="140%" colorInterpolationFilters="sRGB">
                    <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="rough" />
                    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.8 1.55" result="grain" />
                    <feComposite in="rough" in2="grain" operator="in" result="graphite" />
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                    <feOffset in="blur" dy="7" result="drop" />
                    <feComponentTransfer in="drop" result="shadow"><feFuncA type="linear" slope=".2" /></feComponentTransfer>
                    <feMerge><feMergeNode in="shadow" /><feMergeNode in="graphite" /></feMerge>
                  </filter>
                </defs>
                <rect ref={grid} fill="url(#pr-grid)" mask="url(#pr-fade)" className="pr-grid" />
                <path className="pr-guide" ref={guide} />
                {STAGES.map((s, i) => (
                  <circle key={s.title} className="pr-anchor" r="9" ref={(el) => { anchors.current[i] = el; }} />
                ))}
                <g mask="url(#pr-reveal)">
                  <g filter="url(#pr-pencil)">
                    <path className="pr-edge3d" ref={edge} transform="translate(0 2.6)" />
                    <path className="pr-ribbon" ref={ribbon} />
                  </g>
                </g>
              </svg>

              <ol className="pr-stages">
                {STAGES.map((s, i) => (
                  <li key={s.title} ref={(el) => { items.current[i] = el; }}
                    className={`pr-stage ${i % 2 ? 'pr-up' : 'pr-down'}`} style={{ ['--x' as string]: `${XS[i] * 100}%` }}>
                    <p className="pr-kicker"><span>{String(i + 1).padStart(2, '0')}</span>{s.phase}</p>
                    <h3 aria-label={s.title}>{[...s.title].map((ch, k) => (ch === ' ' ? ' ' : <span key={k} aria-hidden="true">{ch}</span>))}</h3>
                    <p className="pr-text">{s.text}</p>
                    <p className="pr-tags">{s.tags.join(' · ')}</p>
                  </li>
                ))}
              </ol>

              {/* Upright layer (not tilted): marker pins standing on the route and the pencil that draws it. */}
              <svg className="pr-over" ref={overlay} aria-hidden="true" focusable="false">
                <path className="pr-measure" ref={measure} />
                {STAGES.map((s, i) => (
                  <g key={s.title} className="pr-mark" ref={(el) => { pins.current[i] = el; }}>
                    <g className="pr-mark-body">
                      <line className="pr-stem" x1="0" y1="0" x2="0" y2={-PIN_H} />
                      <circle className="pr-halo" cy={-PIN_H} r="9" />
                      <circle className="pr-head-dot" cy={-PIN_H} r="4.5" />
                    </g>
                  </g>
                ))}
                <g className="pr-pencil" ref={pencil}>
                  {/* Drawn along +x with the graphite tip at the origin; rotated so the body leans up and to the right. */}
                  <g className="pr-pencil-shadow" transform="translate(10 14) rotate(14)">
                    <path d="M0 0L16-4.5H74V4.5H16Z" />
                  </g>
                  <path className="pr-pencil-wood" d="M0 0L16-4.5V4.5Z" />
                  <path className="pr-pencil-lead" d="M0 0L5.5-1.55V1.55Z" />
                  <rect className="pr-pencil-body" x="16" y="-4.5" width="46" height="9" />
                  <rect className="pr-pencil-facet" x="16" y="-1.2" width="46" height="2.4" />
                  <rect className="pr-pencil-ferrule" x="62" y="-4.8" width="6" height="9.6" />
                  <rect className="pr-pencil-eraser" x="68" y="-4.5" width="6" height="9" rx="1.5" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
