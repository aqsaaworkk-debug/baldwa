'use client';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { compose, aimCamera, disposeObject, type SceneKey, type TodKey, type Composed } from '@/lib/three/scenes';

type Props = { scene: SceneKey; tod: TodKey; pointer: RefObject<{ x: number; y: number }>; active: boolean; reduced: boolean; label?: string };

// Slow drift + eased mouse parallax around the building.
function CameraRig({ c, pointer, reduced }: { c: Composed; pointer: Props['pointer']; reduced: boolean }) {
  const eased = useRef({ x: 0, y: 0 });
  useFrame(({ camera, size, clock }) => {
    const p = pointer.current ?? { x: 0, y: 0 };
    eased.current.x += (p.x - eased.current.x) * .04;
    eased.current.y += (p.y - eased.current.y) * .04;
    const drift = reduced ? 0 : Math.sin(clock.elapsedTime * .12) * .07;
    aimCamera(camera as THREE.PerspectiveCamera, c.def, size.width / size.height, { a: drift - eased.current.x * .18, y: eased.current.y * -2.4 });
  });
  return null;
}

function Exposure({ value }: { value: number }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => { gl.toneMappingExposure = value; }, [gl, value]);
  return null;
}

export default function HeroScene({ scene, tod, pointer, active, reduced, label = 'Live 3D rendering of the featured villa' }: Props) {
  const c = useMemo(() => compose(scene, tod), [scene, tod]);
  useEffect(() => () => disposeObject(c.root), [c]);

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      frameloop={active ? (reduced ? 'demand' : 'always') : 'never'}
      camera={{ fov: c.def.fov, near: .5, far: 2000, position: c.def.cam }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      resize={{ offsetSize: true }} // measure layout size, so a CSS-scaled parent (projects hero card) doesn't shrink the canvas
      style={{ position: 'absolute', inset: 0 }}
      aria-label={label}
      role="img"
    >
      <Exposure value={c.tod.exp} />
      <primitive attach="fog" object={c.fog} />
      <primitive object={c.root} />
      <CameraRig c={c} pointer={pointer} reduced={reduced} />
    </Canvas>
  );
}
