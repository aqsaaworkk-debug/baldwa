// Procedural architecture scenes for the hero and placeholder project images.
// Units are metres. Builders add meshes to a THREE.Group with bx() (bottom-anchored boxes),
// cyl(), tree(), cypress() and warm() (point light).
//
// To show a real building instead, load a GLB with drei's useGLTF and render it in place of
// <primitive object={root} /> (see README).
import * as THREE from 'three';

const D2R = Math.PI / 180;
// three.js uses physical light units: legacy intensities × π keep the same look.
const PI = Math.PI;

export type TodKey = 'golden' | 'day' | 'noon' | 'morning' | 'dusk' | 'dusk2';
export type SceneKey = 'sunfold' | 'courtyard' | 'pavilion' | 'terraces' | 'stepwell' | 'studio';

export type Tod = {
  top: string; hor: string; bot: string; // sky gradient
  hs: string; hg: string; hi: number;    // hemisphere sky/ground/intensity
  sc: string; si: number;                // sun colour/intensity
  el: number; az: number;                // sun elevation/azimuth (degrees)
  exp: number;                           // exposure
};

export const TOD: Record<TodKey, Tod> = {
  golden:  { top: '#5d7ea6', hor: '#f2c99b', bot: '#c4a985', hs: '#cddbef', hg: '#a98962', hi: .55, sc: '#ffcf98', si: 3.1, el: 16, az: 55, exp: 1.0 },
  day:     { top: '#4d7db6', hor: '#e2e8eb', bot: '#c8b9a0', hs: '#d9e6f4', hg: '#b8a27e', hi: .72, sc: '#fff2dc', si: 2.7, el: 46, az: -40, exp: .92 },
  noon:    { top: '#4b7cb5', hor: '#e5eaec', bot: '#c8b9a0', hs: '#dbe7f4', hg: '#bba582', hi: .72, sc: '#fff4e2', si: 2.6, el: 62, az: -25, exp: .9 },
  morning: { top: '#7b9dc3', hor: '#f3dcc0', bot: '#cdb79a', hs: '#dfe8f4', hg: '#bca27e', hi: .62, sc: '#ffe0b8', si: 2.7, el: 24, az: -35, exp: 1.0 },
  dusk:    { top: '#151b2b', hor: '#c97d55', bot: '#2b241f', hs: '#56607a', hg: '#3b2c22', hi: .4, sc: '#ff9d6a', si: 1.3, el: 6, az: 70, exp: 1.15 },
  dusk2:   { top: '#18203a', hor: '#d08a5f', bot: '#2b241f', hs: '#5a6480', hg: '#3b2c22', hi: .42, sc: '#ffa070', si: 1.3, el: 7, az: 100, exp: 1.15 },
};

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; };
}

function skyMesh(t: Tod) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { top: { value: new THREE.Color(t.top) }, hor: { value: new THREE.Color(t.hor) }, bot: { value: new THREE.Color(t.bot) } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform vec3 top;uniform vec3 hor;uniform vec3 bot;varying vec3 vP;
void main(){float h=vP.y;vec3 c=h>0.0?mix(hor,top,pow(clamp(h*1.4,0.0,1.0),0.6)):mix(hor,bot,pow(clamp(-h*5.0,0.0,1.0),0.7));
gl_FragColor=vec4(c,1.0);
#include <colorspace_fragment>
}`,
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), m);
  s.renderOrder = -1;
  return s;
}

type Mats = ReturnType<typeof mats>;
function mats() {
  const S = (c: string, r = .9, m = 0, o: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...o });
  return {
    plaster: S('#eeeae3', .92), plaster2: S('#dcd6cc', .92), stone: S('#cfae84', .88), stone2: S('#b8946a', .9), stone3: S('#a8855e', .9),
    sand: S('#ded0b6', 1), dark: S('#1c1c1d', .55), glass: S('#1d2a33', .06, .9), gold: S('#f5b21a', .3, .8), wood: S('#8e6340', .7),
    water: S('#2e6c80', .05, .6), leaf: S('#68744a', .95, 0, { flatShading: true }), leaf2: S('#4e5b37', .95, 0, { flatShading: true }), trunk: S('#5a4535', .9),
    glow: S('#3a2a1a', .8, 0, { emissive: '#ffae55', emissiveIntensity: 1.6 }),
  };
}

// ---- helpers (y = bottom of the shape) ----
function bx(g: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) {
  const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  me.position.set(x, y + h / 2, z); me.castShadow = true; me.receiveShadow = true; g.add(me); return me;
}
function cyl(g: THREE.Object3D, r: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 12) {
  const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
  me.position.set(x, y + h / 2, z); me.castShadow = true; me.receiveShadow = true; g.add(me); return me;
}
function tree(g: THREE.Object3D, M: Mats, x: number, z: number, s = 1, y0 = 0) {
  const R = rng((x * 73 + z * 31 + 997) | 0);
  cyl(g, .18 * s, 2.4 * s, M.trunk, x, y0, z, 6);
  const n = 3 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) {
    const me = new THREE.Mesh(new THREE.IcosahedronGeometry((1.1 + R() * .8) * s, 0), R() > .5 ? M.leaf : M.leaf2);
    me.position.set(x + (R() - .5) * 1.8 * s, y0 + (2.5 + R() * 1.6) * s, z + (R() - .5) * 1.8 * s);
    me.scale.y = .85; me.rotation.set(R() * 3, R() * 3, 0); me.castShadow = true; g.add(me);
  }
}
function cypress(g: THREE.Object3D, M: Mats, x: number, z: number, s = 1, y0 = 0) {
  cyl(g, .15 * s, 1 * s, M.trunk, x, y0, z, 6);
  const c = new THREE.Mesh(new THREE.ConeGeometry(.95 * s, 6 * s, 7), M.leaf2);
  c.position.set(x, y0 + 4 * s, z); c.castShadow = true; g.add(c);
}
function warm(g: THREE.Object3D, x: number, y: number, z: number, i = 1.6, d = 26) {
  const l = new THREE.PointLight('#ffb066', i * PI, d, 2); l.position.set(x, y, z); g.add(l);
}

type SceneDef = { cam: [number, number, number]; look: [number, number, number]; fov: number; build: (g: THREE.Group, M: Mats) => void };

export const SCENES: Record<SceneKey, SceneDef> = {
  sunfold: { cam: [27, 8.2, 34], look: [1, 3.2, -1], fov: 34, build(g, M) {
    bx(g, 38, .5, 28, M.stone, 0, 0, 0);
    bx(g, 16, 3.2, 9, M.glass, -5, .5, -3); bx(g, .5, 3.2, 9, M.plaster, -13.2, .5, -3); bx(g, .5, 3.2, 9, M.plaster, 3.2, .5, -3);
    bx(g, 7, 3.2, 6, M.stone2, 8, .5, -5);
    bx(g, 22, 3.2, 10, M.plaster, 2, 3.7, -2);
    bx(g, 16, 2.5, .12, M.glass, 0, 4.05, 3.04);
    for (let x = -7.6; x <= 9.2; x += .48) bx(g, .1, 2.9, .55, M.gold, x, 3.86, 3.55);
    bx(g, 22.6, .32, 10.6, M.plaster2, 2, 6.9, -2);
    cyl(g, .2, 3.2, M.dark, 12.4, .5, 2.4, 10);
    bx(g, 15, .06, 5, M.water, -4, .5, 8.6);
    [5.4, 7.6, 9.8].forEach((x) => { bx(g, 1.5, .4, 4, M.plaster2, x, .5, 8.4); bx(g, 1.5, .6, .3, M.plaster2, x, .5, 6.5); });
    bx(g, .6, 2.2, 20, M.stone2, -19, 0, 0); bx(g, 10, 1, .6, M.stone2, -14, 0, 13.7);
    tree(g, M, -22, 7, 1.2); tree(g, M, 21, -9, 1.3); tree(g, M, -22, -9, 1.7); cypress(g, M, 20, -6); cypress(g, M, 22.5, -2.5);
    cypress(g, M, -23, 4, 1.1); tree(g, M, 10, -16, 1.9); tree(g, M, -6, -17, 1.6); tree(g, M, 29, -6, 1.5);
  } },
  courtyard: { cam: [27, 20, 31], look: [0, 2.4, 0], fov: 34, build(g, M) {
    bx(g, 28, .4, 28, M.stone2, 0, 0, 0);
    bx(g, 22, 6.5, 6, M.stone, 0, .4, -8); bx(g, 22, 4, 6, M.stone, 0, .4, 8); bx(g, 6, 6.5, 10, M.stone, -8, .4, 0); bx(g, 6, 5, 10, M.stone, 8, .4, 0);
    [-7.5, -3.8, 3.8, 7.5].forEach((x) => bx(g, 1.4, 2.1, .1, M.dark, x, 1.3, 11.02));
    bx(g, 2.6, 3.1, .14, M.wood, 0, .4, 11.04); bx(g, 3.4, .25, .2, M.gold, 0, 3.5, 11.06);
    [-2.6, 2.6].forEach((z) => { bx(g, 1.4, 1.9, 2.6, M.stone3, 11.7, 2.5, z); bx(g, 1.9, .25, 3, M.stone, 11.7, 4.4, z); bx(g, .1, 1.4, 1.8, M.dark, 12.43, 2.75, z); });
    [-8, -3, 3, 8].forEach((x) => bx(g, 1.2, 1.7, .1, M.dark, x, 4.2, -4.98));
    for (let x = -10.6; x <= 10.6; x += .42) bx(g, .12, .9, .12, M.stone3, x, 4.4, 10.8);
    for (let z = -4.8; z <= 4.8; z += .42) bx(g, .12, .9, .12, M.stone3, 10.8, 5.4, z);
    [[-.9, -.9], [.9, -.9], [-.9, .9], [.9, .9]].forEach((p) => cyl(g, .12, 1.8, M.stone3, 6 + p[0], 6.9, -8 + p[1], 8));
    bx(g, 2.6, .22, 2.6, M.stone, 6, 8.7, -8);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.stone);
    dome.position.set(6, 8.92, -8); dome.castShadow = true; g.add(dome); cyl(g, .06, .6, M.gold, 6, 9.95, -8, 6);
    tree(g, M, -.8, -.8, 1.5, .4); cyl(g, .9, .3, M.water, 2.6, .4, 2.6, 20);
    bx(g, 10, 5, 8, M.plaster2, -24, 0, -22); bx(g, 8, 7.5, 8, M.plaster2, 20, 0, -24); bx(g, 12, 4, 6, M.plaster2, -28, 0, 4); bx(g, 9, 5.5, 9, M.plaster, 26, 0, -8);
    tree(g, M, 17, 13, 1.4); tree(g, M, -17, 15, 1.2); tree(g, M, -19, -11, 1.5); cypress(g, M, 15, -14, 1.1);
  } },
  pavilion: { cam: [30, 4.6, 27], look: [0, 2.2, 0], fov: 30, build(g, M) {
    bx(g, 90, .06, 70, M.water, 0, 0, 0);
    bx(g, 24, .45, 14, M.stone2, 0, 0, 0); bx(g, 4, .45, 16, M.stone2, 0, 0, 14);
    bx(g, 16, 3.4, 7, M.glow, 0, .45, 0);
    for (let x = -8; x <= 8.01; x += 1.6) { bx(g, .08, 3.4, .1, M.dark, x, .45, 3.55); bx(g, .08, 3.4, .1, M.dark, x, .45, -3.55); }
    bx(g, 30, .45, 18, M.plaster, 0, 4.1, 0);
    [-12, -6, 0, 6, 12].forEach((x) => [-7.6, 7.6].forEach((z) => cyl(g, .13, 3.65, M.dark, x, .45, z, 10)));
    warm(g, 0, 2.2, 0, 2.2, 30); warm(g, -6, 2.2, 4.5, 1.2, 18); warm(g, 6, 2.2, 4.5, 1.2, 18);
    for (let z = 8; z < 22; z += 2.2) { bx(g, .25, .25, .25, M.glow, -1.7, .45, z); bx(g, .25, .25, .25, M.glow, 1.7, .45, z); }
    ([[-60, -80, .12, 40], [50, -90, .1, 45], [0, -120, .09, 55], [-110, -40, .1, 50]] as const).forEach((d) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(d[3], 28, 14), M.sand);
      s.scale.y = d[2] * 3; s.position.set(d[0], -d[3] * d[2] * .6, d[1]); s.receiveShadow = true; g.add(s);
    });
  } },
  terraces: { cam: [27, 8.5, 36], look: [0, 13, 0], fov: 40, build(g, M) {
    bx(g, 34, 1, 26, M.stone2, 0, 0, 0);
    for (let i = 0; i < 8; i++) {
      const y = 1 + i * 3.2, o = i % 2 ? 1.6 : -1.6;
      bx(g, 16, .35, 12, M.plaster, o, y, 0); bx(g, 12, 2.85, 8, M.glass, 0, y + .35, 0);
      bx(g, 16, 1, .08, M.glass, o, y + .35, 5.96); bx(g, 3.2, .55, .9, M.leaf, o - 5.2, y + .35, 5.3); bx(g, 2.2, .55, .9, M.leaf2, o + 4.8, y + .35, 5.3);
      if (i % 2 === 0) for (let k = 0; k < 6; k++) bx(g, .1, 2.85, 1.2, M.gold, o + 7.9, y + .35, -4.5 + k * 1.6);
    }
    bx(g, 13, .6, 9, M.plaster2, 0, 26.6, 0); bx(g, 4, 2.4, 4, M.plaster2, -3, 27.2, -1);
    bx(g, 12, 6, 10, M.plaster2, -24, 0, -10); bx(g, 10, 9, 10, M.plaster, 24, 0, -14); bx(g, 14, 4, 8, M.plaster2, 22, 0, 10);
    tree(g, M, -14, 11, 1.4, 1); tree(g, M, 13, 12, 1.3, 1); tree(g, M, -14, -10, 1.2, 1); cypress(g, M, 15, -9, 1, 1); tree(g, M, -22, 14, 1.6); tree(g, M, 6, 18, 1.3);
  } },
  stepwell: { cam: [25, 24, 31], look: [0, 1.2, -2.5], fov: 34, build(g, M) {
    bx(g, 46, 3, 9, M.stone, 0, 0, -15.5); bx(g, 46, 3, 9, M.stone, 0, 0, 15.5); bx(g, 12, 3, 22, M.stone, -17, 0, 0); bx(g, 12, 3, 22, M.stone, 17, 0, 0);
    for (let k = 0; k < 5; k++) {
      const h = 11 - 1.6 * k, top = 2.5 - .5 * k, m = k % 2 ? M.stone2 : M.stone3;
      bx(g, 2 * h, top, 1.6, m, 0, 0, -(h - .8)); bx(g, 2 * h, top, 1.6, m, 0, 0, h - .8);
      bx(g, 1.6, top, 2 * h - 3.2, m, -(h - .8), 0, 0); bx(g, 1.6, top, 2 * h - 3.2, m, h - .8, 0, 0);
    }
    bx(g, 6, .3, 6, M.water, 0, 0, 0);
    bx(g, 30, 3.4, 7, M.plaster, 0, 3, -15.8); bx(g, 26, 2.6, .1, M.glass, 0, 3.3, -12.26); bx(g, 32, .35, 9, M.plaster2, 0, 6.4, -15.4);
    for (let x = 3; x <= 13.5; x += .45) bx(g, .1, 3, .4, M.gold, x, 3.2, -11.8);
    [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach((p) => cyl(g, .12, 2.6, M.dark, 12 + p[0], 3, 15 + p[1], 8));
    bx(g, 4.2, .25, 4.2, M.plaster, 12, 5.6, 15);
    tree(g, M, -19, 15, 1.3, 3); tree(g, M, 19, -15, 1.1, 3); tree(g, M, -19, -8, 1.2, 3); cypress(g, M, -13, 17, 1, 3); cypress(g, M, -10, 17.5, 1, 3);
    tree(g, M, 30, 10, 1.6); tree(g, M, -30, -6, 1.8);
  } },
  studio: { cam: [23, 4.6, 31], look: [-1, 3, 0], fov: 32, build(g, M) {
    bx(g, 34, 4.2, 9, M.stone, 0, 0, 0); bx(g, 32, 3.4, .1, M.glow, 0, .4, 4.56);
    for (let x = -16.2; x <= 16.21; x += .9) bx(g, .25, 4.2, 1.2, M.stone2, x, 0, 5.1);
    bx(g, 36, .4, 11, M.stone2, 0, 4.2, .5);
    bx(g, 20, 3, 7, M.glass, -4, 4.6, -.5); bx(g, 19.6, 2.6, .1, M.glow, -4, 4.8, 3.06); bx(g, 22, .35, 8.6, M.plaster2, -4, 7.6, -.5);
    bx(g, 38, .06, 8, M.water, 0, 0, 12.2);
    warm(g, -8, 2, 6.5, 1.4, 18); warm(g, 4, 2, 6.5, 1.4, 18); warm(g, -4, 5.5, 4, 1, 14);
    cypress(g, M, -20, -2); cypress(g, M, -21.5, 3); cypress(g, M, 20, -3); cypress(g, M, 21.5, 2); tree(g, M, -12, -12, 1.6); tree(g, M, 10, -13, 1.8); tree(g, M, 0, -15, 1.4);
  } },
};

export type Composed = { root: THREE.Group; fog: THREE.Fog; def: SceneDef; tod: Tod };

// Everything for one scene (sky, lights, ground, building) inside a single group.
// R3F renders it with <primitive object={root} />; renderStills.ts wraps it in a Scene.
export function compose(sceneKey: SceneKey, todKey: TodKey): Composed {
  const t = TOD[todKey] ?? TOD.golden;
  const def = SCENES[sceneKey] ?? SCENES.sunfold;
  const root = new THREE.Group();
  root.add(skyMesh(t));
  root.add(new THREE.HemisphereLight(t.hs, t.hg, t.hi * 1.35 * PI));

  const sun = new THREE.DirectionalLight(t.sc, t.si * PI);
  const el = t.el * D2R, az = t.az * D2R;
  sun.position.set(Math.cos(el) * Math.sin(az) * 90, Math.sin(el) * 90, Math.cos(el) * Math.cos(az) * 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 260 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
  root.add(sun); root.add(sun.target);

  const M = mats();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), M.sand);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  const building = new THREE.Group(); root.add(building); def.build(building, M);

  return { root, fog: new THREE.Fog(t.hor, 90, 340), def, tod: t };
}

export function disposeObject(o: THREE.Object3D) {
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    if (m.material) ([] as THREE.Material[]).concat(m.material).forEach((x) => x.dispose());
  });
}

// Points a perspective camera at the scene; widens the lens on portrait screens.
// off.a = extra orbit angle (radians), off.y = extra height.
export function aimCamera(c: THREE.PerspectiveCamera, def: SceneDef, aspect: number, off?: { a: number; y: number }) {
  c.aspect = aspect;
  c.fov = aspect < 1.25 ? Math.min(70, def.fov * Math.pow(1.25 / aspect, .85)) : def.fov;
  const L = new THREE.Vector3(...def.look);
  const v = new THREE.Vector3(...def.cam).sub(L);
  if (off) { v.applyAxisAngle(new THREE.Vector3(0, 1, 0), off.a); v.y += off.y; }
  c.position.copy(L).add(v); c.lookAt(L); c.updateProjectionMatrix();
}
