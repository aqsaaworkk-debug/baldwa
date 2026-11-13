// Renders a still JPEG for each project without a real photo, one at a time so the page
// stays responsive. Uses its own off-screen renderer (outside React Three Fiber).
import * as THREE from 'three';
import { compose, aimCamera, disposeObject } from './scenes';
import type { Project } from '@/data/projects';

export function renderStills(projects: Project[], onImage: (index: number, url: string) => void) {
  const todo = projects.map((p, i) => (p.image ? -1 : i)).filter((i) => i >= 0);
  let cancelled = false;
  if (!todo.length) return () => {};

  const canvas = document.createElement('canvas');
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFShadowMap;
  r.setPixelRatio(1);
  const W = Math.min(1700, Math.max(1100, Math.round(window.innerWidth * 1.1)));
  const H = Math.round(W / 1.6);
  r.setSize(W, H, false);

  let k = 0;
  let timer = 0;
  const next = () => {
    if (cancelled) return;
    if (k >= todo.length) { r.dispose(); return; }
    const i = todo[k++];
    const c = compose(projects[i].scene, projects[i].tod);
    const scene = new THREE.Scene();
    scene.fog = c.fog;
    scene.add(c.root);
    const cam = new THREE.PerspectiveCamera(c.def.fov, W / H, .5, 2000);
    aimCamera(cam, c.def, W / H);
    r.toneMappingExposure = c.tod.exp;
    r.render(scene, cam);
    const url = canvas.toDataURL('image/jpeg', .86);
    disposeObject(scene);
    onImage(i, url);
    timer = window.setTimeout(next, 60);
  };
  timer = window.setTimeout(next, 300);

  return () => { cancelled = true; clearTimeout(timer); r.dispose(); };
}
