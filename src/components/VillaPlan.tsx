'use client';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import Logo from './Logo';
import { villa, floors, roomDims, coveredArea, fmtArea, type FloorKey } from '@/data/villa';
import { hasWebGL, prefersReducedMotion } from '@/lib/dom';
import type { Controls, View } from './three/VillaScene';

const VillaScene = dynamic(() => import('./three/VillaScene'), { ssr: false });

const D2R = Math.PI / 180;
const VIEW_EL: Record<View, number> = { iso: 34 * D2R, plan: 89.4 * D2R, stack: 24 * D2R };
const VIEWS: [View, string][] = [['iso', 'Isometric'], ['plan', '2D Plan'], ['stack', 'Exploded']];
const FLOORS: [FloorKey, string][] = [['ground', 'Ground'], ['first', 'First']];

export default function VillaPlan() {
  const [view, setViewState] = useState<View>('iso');
  const [floor, setFloorState] = useState<FloorKey>('ground');
  const [spin, setSpin] = useState(false);
  const [specOpen, setSpecOpen] = useState(true);
  const [hover, setHover] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [env, setEnv] = useState<{ webgl: boolean; reduced: boolean } | null>(null);
  const [visible, setVisible] = useState(false);
  const viewEl = useRef<HTMLDivElement>(null);
  const needle = useRef<SVGSVGElement>(null);
  const ctl = useRef<Controls>({ az: -.62, azT: -.62, el: VIEW_EL.iso, elT: VIEW_EL.iso, zoom: 1, zoomT: 1, spin: false, dragged: false });
  const drag = useRef<{ x: number; y: number; az: number; el: number } | null>(null);

  useEffect(() => {
    setEnv({ webgl: hasWebGL(), reduced: prefersReducedMotion() });
    // Mount the 3D scene shortly before it scrolls into view.
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { rootMargin: '400px' });
    io.observe(viewEl.current!);
    return () => io.disconnect();
  }, []);

  const setView = (v: View) => {
    setViewState(v);
    const c = ctl.current;
    c.elT = VIEW_EL[v]; c.zoomT = 1;
    if (v === 'plan') { c.azT = Math.round(c.az / (Math.PI * 2)) * Math.PI * 2; c.spin = false; setSpin(false); }
  };
  const setFloor = (f: FloorKey) => { setFloorState(f); setHover(null); setSel(null); };
  const toggleSpin = () => {
    const on = !spin;
    setSpin(on); ctl.current.spin = on;
    if (on && view === 'plan') setView('iso');
  };
  const select = (id: string | null) => setSel((s) => (id && s !== id ? id : null));

  // Drag anywhere on the model to rotate (and tilt, outside plan view).
  const onDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, az: ctl.current.azT, el: ctl.current.elT };
    ctl.current.dragged = false;
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) { ctl.current.dragged = true; viewEl.current?.classList.add('dragging'); }
    ctl.current.azT = d.az - dx * .008;
    if (view !== 'plan') ctl.current.elT = Math.max(12 * D2R, Math.min(75 * D2R, d.el + dy * .005));
  };
  const onUp = () => { drag.current = null; viewEl.current?.classList.remove('dragging'); setTimeout(() => { ctl.current.dragged = false; }, 0); };

  const rooms = useMemo(() => floors[floor].slice().sort((a, b) => a.name.localeCompare(b.name)), [floor]);
  const total = coveredArea(floors.ground) + coveredArea(floors.first);

  return (
    <section id="plan" className="plan gut">
      <div className="wrap plan-head rv">
        <div>
          <p className="eyebrow on-dark">Interactive layout</p>
          <h2>Walk through <em>{villa.name}</em></h2>
        </div>
        <p className="lede on-dark">Switch floors, rotate the model and hover any room to see its size. Every client sees their home like this long before construction starts.</p>
      </div>
      <div className="wrap">
        <div className="plan-app">
          <div className="plan-view" ref={viewEl} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>
            {env?.webgl && visible && (
              <VillaScene view={view} floor={floor} specOpen={specOpen} hover={hover} sel={sel}
                onHover={setHover} onSelect={select} ctl={ctl} needle={needle} reduced={env.reduced} />
            )}
            <div className="plan-hint">{env && !env.webgl ? '3D preview needs WebGL' : <><b>Drag</b> to rotate <span aria-hidden="true">·</span> <b>Hover</b> a room</>}</div>
          </div>

          <aside className="panel left" aria-label="Villa controls">
            <div className="pl-brand"><span style={{ lineHeight: 0 }}><Logo id="mp" /></span><div><b>{villa.name}</b><span>Sample villa · by Baldwa</span></div></div>
            <div>
              <p className="pl-title">Villa details</p>
              <div className="pl-chip"><span>{villa.type}</span><i /><span className="mono">{fmtArea(total)}</span><span>sq.ft</span><i /><span>{villa.facing} facing</span></div>
            </div>
            <div>
              <p className="pl-title">View mode</p>
              <div className="seg">
                {VIEWS.map(([v, label]) => <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{label}</button>)}
              </div>
            </div>
            <div>
              <p className="pl-title">Select floor</p>
              <div className="seg">
                {FLOORS.map(([f, label]) => <button key={f} aria-pressed={floor === f} onClick={() => setFloor(f)}>{label}</button>)}
              </div>
            </div>
            <button className="btn-gold" aria-pressed={spin} onClick={toggleSpin}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" /></svg>
              {spin ? 'Stop rotation' : 'Rotate 360°'}
            </button>
            <button className="btn-ghost" aria-expanded={specOpen} aria-controls="specPanel" onClick={() => setSpecOpen((o) => !o)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
              {specOpen ? 'Hide specifications' : 'View specifications'}
            </button>
          </aside>

          <aside className="panel right" id="specPanel" aria-label="Room specifications" hidden={!specOpen}>
            <div className="sp-head">
              <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5b21a" strokeWidth="1.8" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>Specifications</h3>
              <button className="sp-close" aria-label="Hide specifications" onClick={() => setSpecOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14" /></svg>
              </button>
            </div>
            <div className="sp-sub">Villa: <b>{villa.name.split(' ')[0]}</b> &nbsp;|&nbsp; Facing: <b>{villa.facing}</b> &nbsp;|&nbsp; Floor: <b className="g">{floor.toUpperCase()}</b></div>
            <ul className="sp-list">
              {rooms.map((r) => (
                <li key={r.id}>
                  <button type="button" className={`${r.open ? 'open-air' : ''}${r.id === hover || r.id === sel ? ' hot' : ''}`}
                    onPointerEnter={() => setHover(r.id)} onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(r.id)} onBlur={() => setHover(null)} onClick={() => select(r.id)}>
                    <span>{r.name}</span><span>{roomDims(r)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="sp-foot"><span>Covered area</span><b>{fmtArea(coveredArea(floors[floor]))} sq.ft</b></div>
          </aside>

          <div className="zoom">
            <button aria-label="Zoom in" onClick={() => { ctl.current.zoomT = Math.min(2.6, ctl.current.zoomT * 1.25); }}>+</button>
            <button aria-label="Zoom out" onClick={() => { ctl.current.zoomT = Math.max(.6, ctl.current.zoomT / 1.25); }}>−</button>
          </div>
          <div className="compass" aria-hidden="true">
            <svg ref={needle} width="26" height="26" viewBox="-13 -13 26 26"><path d="M0 -11 L4 2 L0 0 L-4 2Z" fill="#f5b21a" /><path d="M0 11 L4 2 L0 0 L-4 2Z" fill="#555" /></svg>
          </div>
        </div>
      </div>
    </section>
  );
}
