'use client';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { LIGHTS, PLAN, ROOMS, type PlanRoom } from '@/data/floorplan';
import { buildPlanModel, groundShadow, wx, wz } from '@/lib/three/planModel';
import { disposeObject } from '@/lib/three/scenes';

// 3D floor plan of the walkthrough section, staged after the reference clip: the model floats on
// a dark blue stage, its lights come on, the camera goes to the plan view from above, comes back
// down and turns around the model, and ends on the front view. Room names show only on request.

export type PlanView = 'iso' | 'top' | 'front';
export type PlanLight = 'evening' | 'day';
// Mutable camera targets shared with the UI (drag, zoom, view buttons). The scene eases toward them.
// intro: the opening sequence is running and owns the camera until the visitor touches anything.
export type PlanControls = { az: number; azT: number; el: number; elT: number; zoom: number; zoomT: number; spin: boolean; dragged: boolean; intro: boolean };

const D2R = Math.PI / 180, PI = Math.PI;
export const PLAN_VIEWS: Record<PlanView, { az: number; el: number }> = {
  iso: { az: -.7, el: 32 * D2R }, top: { az: 0, el: 89.5 * D2R }, front: { az: 0, el: 46 * D2R },
};
// The opening sequence: [seconds, what happens]
const INTRO = { lightsOn: .1, top: 3.4, iso: 7.6, turnTo: .75, turnEnd: 13.4, front: 13.6, end: 16 };

type Props = {
  view: PlanView; light: PlanLight; labels: boolean; specOpen: boolean; hover: string | null; sel: string | null; play: boolean;
  onHover: (id: string | null) => void; onSelect: (id: string | null) => void; onIntro: (step: PlanView | 'done') => void;
  ctl: RefObject<PlanControls>; reduced: boolean;
  active: boolean; // on screen: the scene only renders while it can be seen
  low: boolean;    // small or weak device: fewer lights, smaller shadow map, lower pixel ratio
};

// On weak devices only the bedroom, lounge and terrace lights are real lights.
const LOW_LIGHTS = [0, 1, 2, 3, 4, 9];

function RoomArea({ r, lit, onHover, onSelect }: { r: PlanRoom; lit: boolean; onHover: Props['onHover']; onSelect: Props['onSelect'] }) {
  const [x0, y0, x1, y1] = r.r;
  return (
    <mesh
      position={[wx((x0 + x1) / 2), r.id === 'void' ? .9 : .025, wz((y0 + y1) / 2)]} rotation-x={-PI / 2}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(r.id); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = ''; }}
      onClick={(e: ThreeEvent<MouseEvent>) => { if (e.delta > 4) return; e.stopPropagation(); onSelect(r.id); }}
    >
      <planeGeometry args={[(x1 - x0) / PLAN.scale, (y1 - y0) / PLAN.scale]} />
      <meshBasicMaterial color="#f4b251" transparent opacity={lit ? .3 : 0} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function Scene(p: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const map = useMemo(() => {
    const t = new THREE.TextureLoader().load(PLAN.image);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = gl.capabilities.getMaxAnisotropy();
    return t;
  }, [gl]);
  const model = useMemo(() => buildPlanModel(map), [map]);
  const shadow = useMemo(() => groundShadow(), []);
  useEffect(() => () => { disposeObject(model.root); map.dispose(); shadow.dispose(); }, [model, map, shadow]);

  const hemi = useRef<THREE.HemisphereLight>(null), sun = useRef<THREE.DirectionalLight>(null), fill = useRef<THREE.DirectionalLight>(null);
  const points = useRef<(THREE.PointLight | null)[]>([]);
  const s = useRef({ t: -1, on: p.reduced ? 1 : 0, day: p.light === 'day' ? 1 : 0, step: '', frames: 0 });
  // Nothing that casts a shadow ever moves, so the shadow map is drawn once (a few frames, to be
  // safe while the model uploads) and then reused.
  useEffect(() => {
    gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = true;
    return () => { gl.shadowMap.autoUpdate = true; };
  }, [gl]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const par = useRef({ x: 0, y: 0 }).current;
  const c1 = useMemo(() => new THREE.Color(), []), c2 = useMemo(() => new THREE.Color(), []);
  const mix = (a: string, b: string, t: number) => c1.set(a).lerp(c2.set(b), t);

  useFrame(({ size, pointer }, dt) => {
    const c = p.ctl.current!, st = s.current;
    if (st.frames < 20) { st.frames++; gl.shadowMap.needsUpdate = true; }
    // opening sequence: owns the camera targets until it ends or the visitor takes over
    let lightsT = 1, ease = .09;
    if (c.intro && !p.reduced) {
      if (!p.play) { lightsT = 0; c.azT = c.az = -.95; c.elT = c.el = 28 * D2R; }
      else {
        st.t = st.t < 0 ? 0 : st.t + Math.min(dt, .1);
        const t = st.t; ease = .05;
        const step = (name: PlanView | 'done') => { if (st.step !== name) { st.step = name; p.onIntro(name); } };
        lightsT = t > INTRO.lightsOn ? 1 : 0;
        if (t < INTRO.top) { c.azT = -.95 + t * .05; c.elT = 28 * D2R; }
        else if (t < INTRO.iso) { step('top'); c.azT = 0; c.elT = PLAN_VIEWS.top.el; }
        else if (t < INTRO.front) { step('iso'); c.elT = PLAN_VIEWS.iso.el; c.azT = THREE.MathUtils.lerp(PLAN_VIEWS.iso.az, INTRO.turnTo, THREE.MathUtils.smoothstep(t, INTRO.iso + 1.2, INTRO.turnEnd)); }
        else { step('front'); c.azT = PLAN_VIEWS.front.az; c.elT = PLAN_VIEWS.front.el; }
        if (t > INTRO.end) { c.intro = false; step('done'); }
      }
    } else if (c.intro) c.intro = false;
    if (c.spin) c.azT += dt * .28;
    const k = p.reduced ? 1 : 1 - Math.pow(1 - ease, dt * 60);
    c.az += (c.azT - c.az) * k; c.el += (c.elT - c.el) * k; c.zoom += (c.zoomT - c.zoom) * k;

    // light: the lamps come on (on 0 → 1); evening and day are two looks of the same lights
    st.on += (lightsT - st.on) * (p.reduced ? 1 : 1 - Math.pow(.955, dt * 60));
    st.day += ((p.light === 'day' ? 1 : 0) - st.day) * (p.reduced ? 1 : 1 - Math.pow(.93, dt * 60));
    const on = st.on, day = st.day, dim = THREE.MathUtils.lerp(.3, 1, on);
    if (hemi.current) { hemi.current.intensity = THREE.MathUtils.lerp(.22, .95, day) * dim * PI; hemi.current.color.copy(mix('#93a6ff', '#ffffff', day)); hemi.current.groundColor.copy(mix('#171b3a', '#b7ab9a', day)); }
    if (sun.current) { sun.current.intensity = THREE.MathUtils.lerp(.75, 1.6, day) * dim * PI; sun.current.color.copy(mix('#a9bbff', '#fff1dc', day)); }
    if (fill.current) fill.current.intensity = THREE.MathUtils.lerp(.1, .3, day) * dim * PI;
    points.current.forEach((l, i) => { if (l) l.intensity = LIGHTS[lights[i]][3] * (p.low ? 7 : 5.5) * on * THREE.MathUtils.lerp(1, .12, day); });
    model.lamp.emissiveIntensity = 2.6 * on * THREE.MathUtils.lerp(1, .25, day);
    gl.toneMappingExposure = THREE.MathUtils.lerp(1.05, .95, day);

    // camera: orbit around the model, fitted into the part of the canvas the side panels leave free (desktop)
    const desktop = window.innerWidth > 900;
    const W = size.width, H = size.height;
    const freeW = Math.max(260, desktop ? W - (p.specOpen ? 690 : 340) : W);
    const span = Math.max(19.5, 25 / (freeW / H)) / c.zoom;        // world height the frame shows at the model
    const dist = span / (2 * Math.tan((camera.fov * D2R) / 2));
    const shift = desktop ? (((p.specOpen ? -30 : 340) / 2) / H) * span : 0;
    // the view leans a little with the pointer, so near and far parts shift against each other (depth)
    const lean = p.reduced || c.dragged ? 0 : 1 - THREE.MathUtils.smoothstep(c.el, 70 * D2R, 88 * D2R);
    par.x += (pointer.x * -.14 * lean - par.x) * .06; par.y += (pointer.y * -.07 * lean - par.y) * .06;
    const az = c.az + par.x, el = THREE.MathUtils.clamp(c.el + par.y, 10 * D2R, 89.5 * D2R);
    target.set(-Math.cos(az) * shift, .4, Math.sin(az) * shift);
    camera.position.set(target.x + Math.cos(el) * Math.sin(az) * dist, target.y + Math.sin(el) * dist, target.z + Math.cos(el) * Math.cos(az) * dist);
    camera.near = Math.max(.5, dist - 30); camera.far = dist + 60;
    camera.lookAt(target); camera.updateProjectionMatrix();
  });

  const lights = useMemo(() => (p.low ? LOW_LIGHTS : LIGHTS.map((_, i) => i)), [p.low]);
  const active = p.hover ?? p.sel;
  return (
    <>
      <hemisphereLight ref={hemi} args={['#93a6ff', '#171b3a', 0]} />
      <directionalLight
        ref={sun} position={[-11, 11, 7]} intensity={0} castShadow
        shadow-mapSize={p.low ? [1024, 1024] : [2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12}
        shadow-camera-near={1} shadow-camera-far={50} shadow-bias={-.0004} shadow-normalBias={.03}
      />
      <directionalLight ref={fill} position={[10, 8, -9]} color="#c9d4ff" intensity={0} />
      {lights.map((n, i) => (
        <pointLight key={n} ref={(l) => { points.current[i] = l; }} position={[wx(LIGHTS[n][0]), LIGHTS[n][2], wz(LIGHTS[n][1])]} color="#ffb265" intensity={0} distance={p.low ? 9 : 7.5} decay={1.6} />
      ))}
      <primitive object={model.root} />
      <mesh position={[0, -2.9, 0]} rotation-x={-PI / 2}>
        <planeGeometry args={[34, 30]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {ROOMS.map((r) => <RoomArea key={r.id} r={r} lit={r.id === active} onHover={p.onHover} onSelect={p.onSelect} />)}
      {ROOMS.filter((r) => p.labels || r.id === active).map((r) => (
        <Html key={r.id} position={[wx((r.r[0] + r.r[2]) / 2), PLAN.wall + .25, wz((r.r[1] + r.r[3]) / 2)]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`rlabel${r.id === active ? ' hot' : ''}`}>{r.name}{r.id === active && <small>{r.note}</small>}</div>
        </Html>
      ))}
    </>
  );
}

export default function PlanScene(props: Props) {
  const range: [number, number] = props.low ? [.9, 1.5] : [1, 2];
  const [dpr, setDpr] = useState(range[1]);
  return (
    <Canvas
      shadows="percentage"
      dpr={dpr}
      frameloop={props.active ? 'always' : 'never'}
      camera={{ fov: 44, near: 1, far: 200, position: [0, 20, 30] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      onPointerMissed={() => { if (!props.ctl.current?.dragged) props.onSelect(null); }}
      style={{ position: 'absolute', inset: 0 }}
      role="img"
      aria-label="3D model of the second floor: three bedrooms with baths, a family lounge, a terrace lounge, lift and staircase"
    >
      {/* slow frames lower the pixel ratio inside the device's range; fast ones raise it again */}
      <PerformanceMonitor onChange={({ factor }) => setDpr(Math.round(THREE.MathUtils.lerp(range[0], range[1], factor) * 4) / 4)} />
      <Scene {...props} />
    </Canvas>
  );
}
