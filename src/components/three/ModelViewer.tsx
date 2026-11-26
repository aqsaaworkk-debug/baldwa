'use client';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Center, Environment, Html, Lightformer, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Model3D } from '@/data/projectStages';
import { buildWardrobe } from '@/lib/three/wardrobeModel';
import { buildBed } from '@/lib/three/bedModel';

// Interactive 3D view of a featured-project stage card (opened from the card's 3D model, Projects.tsx).
// Drag to turn, scroll or pinch to zoom; it turns slowly on its own until touched. The model stands on the floor
// (Center top) on an invisible floor that only catches its shadow, is framed from its own size (Frame), and is lit by local light panels (no
// downloaded environment maps). Models: built in code (`wardrobe`, `bed`), or a GLB file exported from the client's 3D software
// (`glb`, exported without Draco compression so no decoder has to be fetched).

const VIEW = new THREE.Vector3(1, 0.62, 1.25).normalize(); // starting direction: front-right, a little above (like the client's isometric)

function Wardrobe() {
  const model = useMemo(() => buildWardrobe(), []);
  useEffect(() => () => model.dispose(), [model]);
  return <primitive object={model.root} />;
}

function Bed() {
  const model = useMemo(() => buildBed(), []);
  useEffect(() => () => model.dispose(), [model]);
  return <primitive object={model.root} />;
}

function Glb({ src }: { src: string }) {
  const { scene } = useGLTF(src, false);
  useEffect(() => { scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }, [scene]);
  return <primitive object={scene} />;
}

// Points the camera and the orbit target at the model and sets the zoom range from its size (any model, any scale).
function Frame({ children, onSize }: { children: ReactNode; onSize: (radius: number) => void }) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    if (!group.current || !controls) return;
    const box = new THREE.Box3().setFromObject(group.current);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const fov = THREE.MathUtils.degToRad(camera.fov), aspect = size.width / size.height;
    const fit = Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * aspect)); // the narrower of the two view angles
    const dist = (sphere.radius / Math.sin(fit / 2)) * 0.84;
    const target = sphere.center.clone();
    target.y = box.min.y + (box.max.y - box.min.y) * 0.45;
    controls.target.copy(target);
    camera.position.copy(target).addScaledVector(VIEW, dist);
    camera.near = dist / 100; camera.far = dist * 10; camera.updateProjectionMatrix();
    controls.minDistance = sphere.radius * 1.1; controls.maxDistance = dist * 1.8;
    controls.update();
    onSize(sphere.radius);
  }, [camera, controls, size.width, size.height, onSize]);
  return <group ref={group}>{children}</group>;
}

export default function ModelViewer({ model, reduced }: { model: Model3D; reduced: boolean }) {
  const [spin, setSpin] = useState(!reduced);
  const [radius, setRadius] = useState(3);
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 30, position: [6, 3.6, 7] }} gl={{ antialias: true }}>
      <hemisphereLight args={['#ffffff', '#d8cdbd', 0.5 * Math.PI]} />
      <directionalLight position={[radius * 1.4, radius * 2.4, radius * 1.9]} intensity={1.35 * Math.PI} castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-radius={6}
        shadow-camera-left={-radius * 1.3} shadow-camera-right={radius * 1.3} shadow-camera-top={radius * 1.3} shadow-camera-bottom={-radius * 1.3}
        shadow-camera-far={radius * 8} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={1.1} position={[0, 5, -6]} scale={[12, 5, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[-6, 3, 2]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={0.6} position={[6, 2, 3]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} color="#f6e7cf" />
        <Lightformer form="circle" intensity={1.4} position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={4} />
      </Environment>
      <OrbitControls makeDefault enableDamping enablePan={false} autoRotate={spin} autoRotateSpeed={0.55}
        minPolarAngle={0.2} maxPolarAngle={Math.PI / 2 - 0.05} onStart={() => setSpin(false)} />
      <Suspense fallback={<Html center><span className="pj-3d-wait">Loading the model…</span></Html>}>
        <Frame onSize={setRadius}>
          <Center top>
            {model.kind === 'wardrobe' ? <Wardrobe /> : model.kind === 'bed' ? <Bed /> : <Glb src={model.src} />}
          </Center>
        </Frame>
        <mesh rotation-x={-Math.PI / 2} position-y={0.001} receiveShadow>
          <planeGeometry args={[radius * 8, radius * 8]} />
          <shadowMaterial color="#2f4156" opacity={0.22} />
        </mesh>
      </Suspense>
    </Canvas>
  );
}
