'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import Logo from './Logo';
import { villa } from '@/data/villa';
import { PLAN_FACTS, ROOMS } from '@/data/floorplan';
import { hasWebGL, prefersReducedMotion } from '@/lib/dom';
import { PLAN_VIEWS, type PlanControls, type PlanLight, type PlanView } from './three/PlanScene';

// Walkthrough: the 3D floor plan (three/PlanScene) with its controls. The model plays a short
// opening sequence as soon as it enters the screen (lights on, plan view, turn, front view); any touch of the model or the controls hands the camera to the visitor.

const PlanScene = dynamic(() => import('./three/PlanScene'), { ssr: false });

const D2R = Math.PI / 180;
const VIEWS: [PlanView, string][] = [['iso', '3D'], ['top', 'Plan'], ['front', 'Front']];
const LIGHTS: [PlanLight, string][] = [['evening', 'Evening'], ['day', 'Day']];

export default function VillaPlan() {
  const [view, setViewState] = useState<PlanView>('iso');
  const [light, setLight] = useState<PlanLight>('day');
  const [spin, setSpin] = useState(false);
  const [labels, setLabels] = useState(false);
  const [specOpen, setSpecOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [env, setEnv] = useState<{ webgl: boolean; reduced: boolean; low: boolean } | null>(null);
  const [onScreen, setOnScreen] = useState(false); // the scene stops rendering when it is scrolled away
  const [near, setNear] = useState(false);   // close to the viewport: mount the scene
  const [play, setPlay] = useState(false);   // in view: start the opening sequence
  const viewEl = useRef<HTMLDivElement>(null);
  const ctl = useRef<PlanControls>({ az: -.95, azT: -.95, el: 36 * D2R, elT: 36 * D2R, zoom: 1, zoomT: 1, spin: false, dragged: false, intro: true });
  const drag = useRef<{ x: number; y: number; az: number; el: number } | null>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const nav = navigator as Navigator & { deviceMemory?: number };
    const low = window.matchMedia('(max-width: 820px)').matches || (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
    setEnv({ webgl: hasWebGL(), reduced, low });
    if (reduced) { Object.assign(ctl.current, { intro: false, az: PLAN_VIEWS.iso.az, azT: PLAN_VIEWS.iso.az, el: PLAN_VIEWS.iso.el, elT: PLAN_VIEWS.iso.el }); }
    const el = viewEl.current!;
    const mount = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); mount.disconnect(); } }, { rootMargin: '400px' });
    const start = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setPlay(true); start.disconnect(); } }, { threshold: .08 });
    const seen = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    mount.observe(el); start.observe(el); seen.observe(el);
    return () => { mount.disconnect(); start.disconnect(); seen.disconnect(); };
  }, []);

  const takeOver = () => { ctl.current.intro = false; };
  const setView = (v: PlanView) => {
    takeOver(); setViewState(v);
    const c = ctl.current;
    c.elT = PLAN_VIEWS[v].el; c.zoomT = 1;
    // turn the short way round to the view's own direction
    c.azT = PLAN_VIEWS[v].az + Math.round((c.az - PLAN_VIEWS[v].az) / (Math.PI * 2)) * Math.PI * 2;
    if (v === 'top') { c.spin = false; setSpin(false); }
  };
  const toggleSpin = () => {
    takeOver();
    const on = !spin;
    setSpin(on); ctl.current.spin = on;
    if (on && view === 'top') { setViewState('iso'); ctl.current.elT = PLAN_VIEWS.iso.el; }
  };
  const select = (id: string | null) => { takeOver(); setSel((s) => (id && s !== id ? id : null)); };
  const zoom = (f: number) => { takeOver(); ctl.current.zoomT = Math.max(.6, Math.min(2.8, ctl.current.zoomT * f)); };
  // The opening sequence reports its steps, so the buttons show where the camera is.
  const onIntro = (step: PlanView | 'done') => {
    if (step === 'done') return;
    setViewState(step);
  };

  // Drag anywhere on the model to rotate (and tilt, outside the plan view).
  const onDown = (e: PointerEvent) => {
    takeOver();
    drag.current = { x: e.clientX, y: e.clientY, az: ctl.current.azT, el: ctl.current.elT };
    ctl.current.dragged = false;
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) { ctl.current.dragged = true; viewEl.current?.classList.add('dragging'); }
    ctl.current.azT = d.az - dx * .008;
    if (view !== 'top') ctl.current.elT = Math.max(14 * D2R, Math.min(80 * D2R, d.el + dy * .005));
  };
  const onUp = () => { drag.current = null; viewEl.current?.classList.remove('dragging'); setTimeout(() => { ctl.current.dragged = false; }, 0); };

  return (
    // Evening light turns the whole section dark (villa-plan.css, .plan-night); Day keeps it on the page canvas.
    <section id="plan" className={`plan${light === 'evening' ? ' plan-night' : ''}`}>
      <div className="gut"><div className="wrap plan-head rv">
        <div>
          <p className="eyebrow">Interactive layout</p>
          <h2>Walk through <em>{villa.name}</em></h2>
        </div>
        <p className="lede">Immersive 3D project walkthroughs: turn the model, look at it from above, switch the lights and pick any room, long before construction starts.</p>
      </div></div>
      <div>
        <div className="plan-app">
          <div className="plan-view" ref={viewEl} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>
            {env?.webgl && near && (
              <PlanScene view={view} light={light} labels={labels} specOpen={specOpen} hover={hover} sel={sel} play={play}
                onHover={setHover} onSelect={select} onIntro={onIntro} ctl={ctl} reduced={env.reduced} active={onScreen} low={env.low} />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {env && !env.webgl && <img className="plan-flat" src="/images/plan/second-floor.webp" alt="Plan of the second floor: three bedrooms with baths, a family lounge, a terrace lounge, lift and staircase" />}
            <div className="plan-hint">{env && !env.webgl ? '3D preview needs WebGL' : <><b>Drag</b> to rotate <span aria-hidden="true">·</span> <b>Tap</b> a room</>}</div>
          </div>

          <aside className="panel left" aria-label="Model controls">
            <div className="pl-brand"><span style={{ lineHeight: 0 }}><Logo id="mp" /></span><div><b>{villa.name}</b><span>{PLAN_FACTS.floor} · by Baldwa</span></div></div>
            <div>
              <p className="pl-title">This floor</p>
              <div className="pl-chip"><span>{PLAN_FACTS.bedrooms} bedrooms</span><i /><span>{PLAN_FACTS.baths} baths</span><i /><span>Lounge + terrace</span></div>
            </div>
            <div>
              <p className="pl-title">View</p>
              <div className="seg">
                {VIEWS.map(([v, label]) => <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{label}</button>)}
              </div>
            </div>
            <div>
              <p className="pl-title">Light</p>
              <div className="seg">
                {LIGHTS.map(([l, label]) => <button key={l} aria-pressed={light === l} onClick={() => { takeOver(); setLight(l); }}>{label}</button>)}
              </div>
            </div>
            <button className="btn-gold" aria-pressed={spin} onClick={toggleSpin}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" /></svg>
              {spin ? 'Stop rotation' : 'Rotate 360°'}
            </button>
            <button className="btn-ghost" aria-pressed={labels} onClick={() => { takeOver(); setLabels((o) => !o); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 12 12 20 4 12V4h8z" /><path d="M8.5 8.5h.01" /></svg>
              {labels ? 'Hide room names' : 'Show room names'}
            </button>
          </aside>

          <aside className="panel right" id="specPanel" aria-label="Rooms on this floor" hidden={!specOpen}>
            <div className="sp-head">
              <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>Rooms</h3>
              <button className="sp-close" aria-label="Hide room list" onClick={() => setSpecOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14" /></svg>
              </button>
            </div>
            <div className="sp-sub">Villa: <b>{villa.name.split(' ')[0]}</b> &nbsp;|&nbsp; Floor: <b className="g">SECOND</b></div>
            <ul className="sp-list">
              {ROOMS.map((r) => (
                <li key={r.id}>
                  <button type="button" className={`open-air${r.id === hover || r.id === sel ? ' hot' : ''}`}
                    onPointerEnter={() => setHover(r.id)} onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(r.id)} onBlur={() => setHover(null)} onClick={() => select(r.id)}>
                    <span>{r.name}</span><span>{r.note}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="sp-foot"><span>Rooms and spaces</span><b>{ROOMS.length}</b></div>
          </aside>

          {!specOpen && (
            <button className="sp-open" onClick={() => setSpecOpen(true)}>Rooms</button>
          )}
          <div className="zoom">
            <button aria-label="Zoom in" onClick={() => zoom(1.25)}>+</button>
            <button aria-label="Zoom out" onClick={() => zoom(1 / 1.25)}>−</button>
          </div>
        </div>
      </div>
    </section>
  );
}
