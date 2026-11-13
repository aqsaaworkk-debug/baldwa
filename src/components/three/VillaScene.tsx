'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { floors, roomDims, type FloorKey, type Room } from '@/data/villa';
import { buildFloorModel, floorColor, toX, toZ } from '@/lib/three/villaModel';
import { disposeObject } from '@/lib/three/scenes';

export type View = 'iso' | 'plan' | 'stack';

// Mutable camera targets shared with the UI (drag, zoom buttons). The scene eases toward them.
export type Controls = { az: number; azT: number; el: number; elT: number; zoom: number; zoomT: number; spin: boolean; dragged: boolean };

type Props = {
  view: View; floor: FloorKey; specOpen: boolean; hover: string | null; sel: string | null;
  onHover: (id: string | null) => void; onSelect: (id: string | null) => void;
  ctl: RefObject<Controls>; needle: RefObject<SVGSVGElement | null>; reduced: boolean;
};

const PI = Math.PI;
const FLOOR_KEYS: FloorKey[] = ['ground', 'first'];
const STACK_GAP = 15;

function RoomSlab({ r, interactive, lit, onHover, onSelect }: {
  r: Room; interactive: boolean; lit: boolean; onHover: Props['onHover']; onSelect: Props['onSelect'];
}) {
  const w = r.x1 - r.x0, d = r.z1 - r.z0;
  const handlers = interactive ? {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(r.id); document.body.style.cursor = 'pointer'; },
    onPointerOut: () => { onHover(null); document.body.style.cursor = ''; },
    onClick: (e: ThreeEvent<MouseEvent>) => { if (e.delta > 4) return; e.stopPropagation(); onSelect(r.id); },
  } : {};
  return (
    <mesh position={[toX((r.x0 + r.x1) / 2), -.2, toZ((r.z0 + r.z1) / 2)]} receiveShadow castShadow {...handlers}>
      <boxGeometry args={[w, .4, d]} />
      <meshStandardMaterial color={floorColor(r.kind)} roughness={.8} emissive={lit ? '#f5b21a' : '#000000'} emissiveIntensity={lit ? .55 : 0} />
    </mesh>
  );
}

function Label({ r, plan, hot }: { r: Room; plan: boolean; hot: boolean }) {
  return (
    <Html position={[toX((r.x0 + r.x1) / 2), plan ? .2 : 4.6, toZ((r.z0 + r.z1) / 2)]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`rlabel${hot ? ' hot' : ''}`}>{r.name}<small>{roomDims(r)}</small></div>
    </Html>
  );
}

function Scene(p: Props) {
  const set = useThree((s) => s.set);
  const cam = useMemo(() => Object.assign(new THREE.OrthographicCamera(-1, 1, 1, -1, -600, 1200), { manual: true }), []);
  useLayoutEffect(() => { set({ camera: cam }); }, [cam, set]);

  const models = useMemo(() => ({ ground: buildFloorModel('ground'), first: buildFloorModel('first') }), []);
  useEffect(() => () => { disposeObject(models.ground); disposeObject(models.first); }, [models]);

  const groups = { ground: useRef<THREE.Group>(null), first: useRef<THREE.Group>(null) };
  const cy = useRef(0);

  // Drop the newly selected floor in from above/below.
  useEffect(() => {
    const g = groups[p.floor].current;
    if (g && p.view !== 'stack' && !p.reduced) g.position.y = p.floor === 'first' ? 7 : -3;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.floor]);

  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ size }) => {
    const c = p.ctl.current!;
    const k = p.reduced ? 1 : .09;
    if (c.spin) c.azT += .0045;
    c.az += (c.azT - c.az) * k; c.el += (c.elT - c.el) * k; c.zoom += (c.zoomT - c.zoom) * k;
    const stack = p.view === 'stack';
    cy.current += ((stack ? STACK_GAP / 2 : 0) - cy.current) * k;

    FLOOR_KEYS.forEach((f) => {
      const g = groups[f].current; if (!g) return;
      g.visible = stack || f === p.floor;
      const yT = stack && f === 'first' ? STACK_GAP : 0;
      g.position.y += (yT - g.position.y) * (p.reduced ? 1 : .1);
    });

    // Fit the model into the part of the canvas not covered by the side panels (desktop).
    const desktop = window.innerWidth > 900;
    const W = size.width, H = size.height;
    const freeW = Math.max(260, desktop ? W - (p.specOpen ? 690 : 340) : W);
    const fasp = freeW / H;
    let vh = p.view === 'plan' ? Math.max(54, 70 / fasp) : stack ? Math.max(72, 92 / fasp) : Math.max(58, 82 / fasp);
    vh /= c.zoom;
    const shift = desktop ? (((p.specOpen ? -30 : 340) / 2) / H) * vh : 0;
    const asp = W / H;
    cam.left = -vh * asp / 2 - shift; cam.right = vh * asp / 2 - shift; cam.top = vh / 2; cam.bottom = -vh / 2;
    target.set(0, cy.current, 0);
    cam.position.set(Math.cos(c.el) * Math.sin(c.az) * 400, cy.current + Math.sin(c.el) * 400, Math.cos(c.el) * Math.cos(c.az) * 400);
    cam.up.set(0, 1, 0); cam.lookAt(target); cam.updateProjectionMatrix();

    if (p.needle.current) p.needle.current.style.transform = `rotate(${(c.az * 180) / PI}deg)`;
  });

  const active = p.hover ?? p.sel;
  return (
    <>
      <hemisphereLight args={['#ffffff', '#3a3530', .8 * PI]} />
      <directionalLight
        position={[-45, 80, 55]} color="#fff0da" intensity={1.55 * PI} castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-55} shadow-camera-right={55} shadow-camera-top={55} shadow-camera-bottom={-55}
        shadow-camera-near={1} shadow-camera-far={260} shadow-bias={-.0005} shadow-normalBias={.04}
      />
      <directionalLight position={[50, 30, -40]} color="#ffd9a0" intensity={.35 * PI} />
      {FLOOR_KEYS.map((f) => {
        const current = f === p.floor;
        return (
          <group key={f} ref={groups[f]} visible={f === 'ground'}>
            <primitive object={models[f]} />
            {floors[f].filter((r) => r.kind !== 'void').map((r) => (
              <RoomSlab key={r.id} r={r} interactive={current} lit={current && (r.id === p.hover || r.id === p.sel)} onHover={p.onHover} onSelect={p.onSelect} />
            ))}
            {current && floors[f].filter((r) => p.view === 'plan' || r.id === active).map((r) => (
              <Label key={r.id} r={r} plan={p.view === 'plan'} hot={r.id === active} />
            ))}
          </group>
        );
      })}
    </>
  );
}

export default function VillaScene(props: Props) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.toneMappingExposure = 1.05; }}
      onPointerMissed={() => { if (!props.ctl.current?.dragged) props.onSelect(null); }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
