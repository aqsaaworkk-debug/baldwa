'use client';
import { useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import type * as THREE from 'three';
import { createJourneyWorld, type JourneyWorld } from '@/lib/journey/world';
import { journey, lerp, type Quality } from '@/lib/journey/stages';

// Reads the master progress every frame and hands it to the world. Nothing here keeps
// state of its own, so the picture always matches the scroll position, in both directions.
function Rig({ world }: { world: JourneyWorld }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => { gl.toneMappingExposure = world.exposure; }, [gl, world]);
  useFrame(({ camera, size, clock }) => {
    world.update(journey.p, clock.elapsedTime, camera as THREE.PerspectiveCamera, size.width / size.height);
  });
  return null;
}

export default function JourneyScene({ quality, active }: { quality: Quality; active: boolean }) {
  // Built and disposed by one effect, so a world is never disposed while it is still shown
  // (React re-runs effects once on mount in development).
  const [world, setWorld] = useState<JourneyWorld | null>(null);
  useEffect(() => {
    const w = createJourneyWorld(quality);
    setWorld(w);
    return () => { setWorld(null); w.dispose(); };
  }, [quality]);
  const [dpr, setDpr] = useState(quality.dpr[1]);

  return (
    <Canvas
      shadows={quality.shadow ? 'percentage' : false}
      dpr={dpr}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 42, near: 30, far: 60000, position: [0, 1500, 2600] }}
      gl={{ antialias: quality.tier === 'high', powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
      role="img"
      aria-label="Real-time 3D view: clouds parting above a green neighbourhood with an empty plot beside the road"
    >
      {/* Slow frames lower the pixel ratio inside the tier's range; fast ones raise it again. */}
      <PerformanceMonitor onChange={({ factor }) => setDpr(Math.round(lerp(quality.dpr[0], quality.dpr[1], factor) * 4) / 4)} />
      {world && <>
        <primitive attach="fog" object={world.fog} />
        <primitive object={world.root} />
        <Rig world={world} />
      </>}
    </Canvas>
  );
}
