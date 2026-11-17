// Procedural neighbourhood around the plot: ground, streets, houses, compound walls, trees,
// palms and the fenced empty site. Everything is generated from a seed (no downloaded assets)
// and drawn with instanced meshes. Units are metres; see PLOT and ROAD in stages.ts.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng } from '@/lib/three/scenes';
import { PLOT, ROAD, type Quality } from './stages';

const TOWN_R = 820;       // streets and houses fade out towards this radius
const BLOCK_Z = 96;       // spacing of the streets that run along x
const BLOCK_X = 150;      // spacing of the streets that run along z
const NEAR = 260;         // inside this radius things get full detail and cast shadows
const PLOT_CZ = (PLOT.z0 + PLOT.z1) / 2;

type Item = { x: number; y: number; z: number; sx: number; sy: number; sz: number; ry: number; color: THREE.Color };

// Collects instances, then turns them into one InstancedMesh.
function batch() {
  const list: Item[] = [];
  return {
    add(x: number, y: number, z: number, sx: number, sy: number, sz: number, color: THREE.Color, ry = 0) { list.push({ x, y, z, sx, sy, sz, ry, color }); },
    build(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, cast = false, receive = false) {
      if (!list.length) return;
      const mesh = new THREE.InstancedMesh(geometry, material, list.length);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
      list.forEach((it, i) => {
        m.compose(new THREE.Vector3(it.x, it.y, it.z), q.setFromAxisAngle(up, it.ry), new THREE.Vector3(it.sx, it.sy, it.sz));
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, it.color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = cast; mesh.receiveShadow = receive; mesh.frustumCulled = false;
      parent.add(mesh);
    },
  };
}

const col = (hex: string) => new THREE.Color(hex);
const hsl = (h: number, s: number, l: number) => new THREE.Color().setHSL(h, s, l, THREE.SRGBColorSpace);

// Tiling value noise, a different frequency mix in each channel. Used by the ground shader.
function groundNoise() {
  const rand = rng(4242), size = 256;
  const layer = (n: number) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = rand(); return { n, a }; };
  const sample = ({ n, a }: { n: number; a: Float32Array }, u: number, v: number) => {
    const X = u * n, Y = v * n, x0 = Math.floor(X), y0 = Math.floor(Y);
    const f = (t: number) => t * t * (3 - 2 * t), fx = f(X - x0), fy = f(Y - y0);
    const at = (i: number, j: number) => a[(i % n) * n + (j % n)];
    return (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy;
  };
  const sets = [[layer(4), layer(9), layer(21)], [layer(6), layer(13), layer(29)], [layer(8), layer(19), layer(43)]];
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const o = (j * size + i) * 4, u = i / size, v = j / size;
    for (let c = 0; c < 3; c++) data[o + c] = Math.round(255 * (sample(sets[c][0], u, v) * .5 + sample(sets[c][1], u, v) * .3 + sample(sets[c][2], u, v) * .2));
    data[o + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}

// One material for the whole plain: patchy grass and dry earth, greener inside the town,
// bare soil on the plot and along the road verges.
function groundMaterial(noise: THREE.Texture) {
  const mat = new THREE.MeshStandardMaterial({ color: '#8d9050', roughness: 1 });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uGN: { value: noise }, uDry: { value: col('#a39168') }, uGrass: { value: col('#66733c') }, uLush: { value: col('#465a2c') }, uSoil: { value: col('#ab9068') },
    });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;\nuniform sampler2D uGN;\nuniform vec3 uDry;\nuniform vec3 uGrass;\nuniform vec3 uLush;\nuniform vec3 uSoil;')
      .replace('#include <color_fragment>', /* glsl */ `#include <color_fragment>
      {
        vec2 w = vWorld.xz;
        float n1 = texture2D(uGN, w * 0.00021).r, n2 = texture2D(uGN, w * 0.0017).g, n3 = texture2D(uGN, w * 0.013).b, n4 = texture2D(uGN, w * 0.11).r;
        float grass = smoothstep(0.38, 0.66, n1 * 0.5 + n2 * 0.38 + n3 * 0.2);
        float town = 1.0 - smoothstep(380.0, 1300.0, length(w) + (n2 - 0.5) * 500.0);
        vec3 c = mix(uDry, uGrass, grass);
        c = mix(c, uLush, town * (0.25 + 0.6 * smoothstep(0.3, 0.7, n3)));
        vec2 pd = abs(w - vec2(0.0, ${PLOT_CZ.toFixed(1)})) - vec2(${(PLOT.w / 2).toFixed(1)}, ${(PLOT.d / 2).toFixed(1)});
        float plot = 1.0 - smoothstep(-1.5, 1.0, max(pd.x, pd.y) + (n4 - 0.5) * 2.0);
        float verge = (1.0 - smoothstep(5.0, 9.5, abs(w.y - ${ROAD.z.toFixed(1)}) + (n4 - 0.5) * 3.0)) * (1.0 - smoothstep(500.0, 800.0, abs(w.x)));
        vec3 soil = uSoil * (0.8 + 0.4 * n3);
        soil = mix(soil, uGrass * 1.1, smoothstep(0.52, 0.78, n2 * 0.4 + n3 * 0.6) * 0.4);
        c = mix(c, soil, max(plot, verge * 0.85));
        diffuseColor.rgb = c * (0.78 + 0.44 * n4);
      }`);
  };
  return mat;
}

// Asphalt with a dashed centre line and edge lines; one tile is 12 m of road.
function roadTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#5b5d60'; g.fillRect(0, 0, 512, 128);
  const rand = rng(99);
  for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${rand() > .5 ? 255 : 0},${rand() > .5 ? 255 : 0},${rand() > .5 ? 255 : 0},.035)`; g.fillRect(rand() * 512, rand() * 128, 2, 2); }
  g.fillStyle = 'rgba(238,236,228,.9)';
  g.fillRect(0, 62.5, 190, 3);
  g.fillRect(0, 5, 512, 2); g.fillRect(0, 121, 512, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

// Foliage: darker inside and underneath, lighter on top, with a leafy speckle, so a canopy
// made of a few lumps does not read as smooth plastic.
function leafMaterial(noise: THREE.Texture) {
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uGN = { value: noise };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;\nuniform sampler2D uGN;')
      .replace('#include <color_fragment>', `#include <color_fragment>
      {
        float leaves = texture2D(uGN, vLocal.xz * 1.9 + vLocal.y * 0.7).b * 0.6 + texture2D(uGN, vLocal.xy * 4.3 + vLocal.z).g * 0.4;
        diffuseColor.rgb *= (0.5 + 0.62 * smoothstep(-0.7, 0.9, vLocal.y)) * (0.62 + 0.8 * leaves);
      }`);
  };
  return mat;
}

// A lumpy sphere for tree canopies (smooth normals, so it reads as foliage, not as a gem).
function canopyGeometry(detail: number) {
  const g = mergeVertices(new THREE.IcosahedronGeometry(1, detail).deleteAttribute('uv').deleteAttribute('normal'));
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const r = 1 + .17 * Math.sin(4.1 * x + 1) * Math.cos(3.7 * y + 2) + .13 * Math.sin(5.3 * z + .7) * Math.sin(3.1 * x + 2 * y);
    p.setXYZ(i, x * r, y * r * .86, z * r);
  }
  g.computeVertexNormals();
  return g;
}

// Palm crown: eight drooping fronds around the top of the trunk.
function palmCrown() {
  const fronds: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 8; i++) {
    const f = new THREE.ConeGeometry(.55, 4.4, 4).scale(1, 1, .22);
    f.translate(0, 2.2, 0).rotateZ(-Math.PI / 2 - .38 - (i % 2) * .22).rotateY((i / 8) * Math.PI * 2 + (i % 3) * .1);
    fronds.push(f);
  }
  return mergeGeometries(fronds)!;
}

export function buildSite(q: Quality) {
  const group = new THREE.Group();
  const rand = rng(20261114);
  const R = (a: number, b: number) => a + (b - a) * rand();
  const std = (o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .92, ...o });

  // ---- Ground ----
  const noise = groundNoise();
  const ground = new THREE.Mesh(new THREE.CircleGeometry(24000, 72).rotateX(-Math.PI / 2), groundMaterial(noise));
  ground.receiveShadow = true;
  group.add(ground);

  // ---- Streets ----
  const zStreets: number[] = [], xStreets: number[] = [];
  for (let k = -8; k <= 8; k++) zStreets.push(ROAD.z + k * BLOCK_Z);
  for (let j = 0; j < 6; j++) { xStreets.push(82 + j * BLOCK_X); xStreets.push(-82 - j * BLOCK_X); }
  const half = (c: number) => Math.sqrt(Math.max(0, TOWN_R * TOWN_R - c * c));
  const asphalt = (o: THREE.MeshStandardMaterialParameters) => std({ roughness: .96, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o });
  const lane = asphalt({ color: '#948a78' }); // side streets are dusty lanes, only the main road is tarred
  const flat = (w: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), m);
    mesh.position.set(x, y, z); mesh.receiveShadow = true; group.add(mesh);
  };
  for (const z of zStreets) {
    const len = half(z - ROAD.z) * 2;
    if (len < 60) continue;
    if (z === ROAD.z) {
      const tex = roadTexture(); tex.repeat.set(len / 12, 1);
      flat(len, ROAD.w, asphalt({ map: tex }), 0, .06, z);
    } else flat(len, 5, lane, 0, .05, z);
  }
  for (const x of xStreets) { const len = half(x) * 2; if (len > 60) flat(5, len, lane, x, .04, ROAD.z); }

  const inTown = (x: number, z: number) => Math.hypot(x, z - ROAD.z) < TOWN_R;
  const onStreet = (x: number, z: number, margin: number) =>
    inTown(x, z) && (zStreets.some((s) => Math.abs(z - s) < (s === ROAD.z ? ROAD.w / 2 : 3) + margin) || xStreets.some((s) => Math.abs(x - s) < 3 + margin));
  const onPlot = (x: number, z: number, margin: number) => Math.abs(x) < PLOT.w / 2 + margin && z > PLOT.z0 - margin && z < ROAD.z + ROAD.w / 2 + margin;
  // Open ground between the road and the camera: nothing tall may stand here.
  const inForeground = (x: number, z: number, halfW: number) => Math.abs(x) < halfW && z > ROAD.z && z < 150;

  // ---- Houses ----
  const B = { bodyNear: batch(), body: batch(), slab: batch(), tank: batch(), window: batch(), wall: batch() };
  const PALETTE = ['#e4dfd4', '#e2d8c2', '#e6cdbb', '#e3d5a8', '#d0dae0', '#dfc0ae', '#e7e3da', '#d9d3c6'].map(col);
  const SLAB = col('#d8d4ca'), GLASS = col('#27313a'), DOOR = col('#6b4a32'), WALL = col('#e6e1d6'), SHADE = col('#c98a6a');
  const TANKS = [col('#20242a'), col('#3d6fa3'), col('#20242a')];
  const houses: { x: number; z: number; w: number; d: number }[] = [];

  const house = (x: number, z: number, facing: 1 | -1) => {
    const w = R(9, 14), d = R(8, 11), storeys = rand() < .45 ? 2 : 1, h = storeys * 3.2 + .2;
    const near = Math.hypot(x, z) < NEAR, paint = PALETTE[Math.floor(rand() * PALETTE.length)];
    houses.push({ x, z, w, d });
    (near ? B.bodyNear : B.body).add(x, 0, z, w, h, d, paint);
    B.slab.add(x, h, z, w + .6, .24, d + .6, SLAB);
    let top = h + .24, tx = x + R(-w / 4, w / 4), tz = z + R(-d / 4, d / 4);
    if (rand() < .42) { // stair room on the roof
      tx = x + (rand() < .5 ? -1 : 1) * (w / 2 - 1.7); tz = z - facing * (d / 2 - 1.6);
      (near ? B.bodyNear : B.body).add(tx, top, tz, 3.2, 2.4, 3, paint);
      B.slab.add(tx, top + 2.4, tz, 3.6, .16, 3.4, SLAB);
      top += 2.56;
    }
    if (rand() < .62) B.tank.add(tx, top, tz, .7, 1.3, .7, TANKS[Math.floor(rand() * 3)]);
    if (!near) return;
    for (let s = 0; s < storeys; s++) {
      const y = s * 3.2 + 1.05;
      const nx = Math.max(2, Math.floor(w / 3.4)), nz = Math.max(2, Math.floor(d / 3.6));
      for (let i = 0; i < nx; i++) {
        const wx = x - w / 2 + (w / nx) * (i + .5);
        for (const f of [1, -1]) {
          const isDoor = s === 0 && f === facing && i === Math.floor(nx / 2);
          if (isDoor) B.window.add(wx, 0, z + f * (d / 2 + .02), 1.1, 2.15, .1, DOOR);
          else B.window.add(wx, y, z + f * (d / 2 + .02), 1.35, 1.3, .1, GLASS);
          if (f === facing) B.slab.add(wx, isDoor ? 2.3 : y + 1.42, z + f * (d / 2 + .3), 1.9, .08, .6, rand() < .3 ? SHADE : SLAB);
        }
      }
      for (let i = 0; i < nz; i++) for (const f of [1, -1]) B.window.add(x + f * (w / 2 + .02), y, z - d / 2 + (d / nz) * (i + .5), .1, 1.3, 1.2, GLASS);
    }
    // compound wall
    const lw = 11.6, ld = 10.4;
    for (const f of [1, -1]) { B.wall.add(x, 0, z + f * ld, lw * 2, 1.5, .2, WALL); B.wall.add(x + f * lw, 0, z, .2, 1.5, ld * 2, WALL); }
  };

  for (const zs of zStreets) for (const [zc, facing] of [[zs - 16, 1], [zs - BLOCK_Z + 16, -1]] as const) {
    for (let x = -TOWN_R; x <= TOWN_R; x += 24) {
      const r = Math.hypot(x, zc - ROAD.z);
      const chance = .94 * (1 - THREE.MathUtils.smoothstep(r + R(-90, 90), 330, 800)) * (r < NEAR ? 1 : q.detail);
      const taken = rand() < chance; // drawn every time so the layout does not depend on the skips below
      if (!taken || xStreets.some((s) => Math.abs(x - s) < 15) || onPlot(x, zc, 14) || inForeground(x, zc, 62)) continue;
      house(x + R(-1.5, 1.5), zc + R(-1, 1), facing);
    }
  }
  const inHouse = (x: number, z: number) => houses.some((h) => Math.abs(x - h.x) < h.w / 2 + 1.6 && Math.abs(z - h.z) < h.d / 2 + 1.6);

  // ---- Trees ----
  const T = { canopyNear: batch(), canopyMid: batch(), canopyFar: batch(), trunk: batch(), palmTrunk: batch(), palmCrown: batch() };
  const BARK = col('#5d4a3a'), PALM_BARK = col('#8a7a66');
  const green = () => hsl(R(.22, .3), R(.3, .46), R(.2, .3));
  const free = (x: number, z: number, m = 1.5) => !onStreet(x, z, m) && !onPlot(x, z, 2.5) && !inForeground(x, z, 38) && !inHouse(x, z);

  const tree = (x: number, z: number, scale = 1, force = false) => {
    if (!force && !free(x, z)) return;
    const dist = Math.hypot(x, z), H = R(6, 11) * scale, c = green();
    if (dist > 1000) { T.canopyFar.add(x, H * .5, z, H * .46, H * .5, H * .46, c, R(0, 6)); return; }
    if (dist > NEAR) {
      T.canopyMid.add(x, H * .62, z, H * .36, H * .38, H * .36, c, R(0, 6));
      T.canopyMid.add(x + R(-1, 1) * H * .2, H * .5, z + R(-1, 1) * H * .2, H * .28, H * .26, H * .28, c.clone().multiplyScalar(R(.8, 1.1)), R(0, 6));
      return;
    }
    T.trunk.add(x, 0, z, .16 + H * .014, H * .5, .16 + H * .014, BARK);
    T.canopyNear.add(x, H * .68, z, H * .34, H * .34, H * .34, c, R(0, 6));
    for (let i = 0; i < 5; i++) {
      const a = R(0, Math.PI * 2), o = H * R(.14, .3), s = H * R(.17, .26);
      T.canopyNear.add(x + Math.cos(a) * o, H * R(.52, .7), z + Math.sin(a) * o, s, s * .9, s, c.clone().multiplyScalar(R(.78, 1.14)), R(0, 6));
    }
  };
  const palm = (x: number, z: number, force = false) => {
    if (!force && !free(x, z)) return;
    if (Math.hypot(x, z) > 1000) { tree(x, z, 1, force); return; }
    const H = R(8, 12.5);
    T.palmTrunk.add(x, 0, z, .2, H, .2, PALM_BARK);
    T.palmCrown.add(x, H - .2, z, 1, 1, 1, hsl(R(.24, .28), R(.32, .44), R(.16, .22)), R(0, 6));
  };
  const bush = (x: number, z: number) => {
    const s = R(.7, 1.4), flower = rand() < .13;
    T.canopyNear.add(x, s * .55, z, s, s * .75, s, flower ? hsl(R(.9, .96), .5, .52) : green(), R(0, 6));
  };
  const plant = (x: number, z: number, scale = 1) => (rand() < .17 ? palm(x, z) : tree(x, z, scale));

  // gardens: a few trees around each house
  for (const h of houses) for (let i = 0, n = 1 + Math.floor(rand() * 4); i < n; i++) {
    const side = rand() < .5 ? 1 : -1;
    if (rand() < .5) plant(h.x + side * R(h.w / 2 + 2.5, 11), h.z + R(-10, 10), .85);
    else plant(h.x + R(-11, 11), h.z + side * R(h.d / 2 + 2.5, 10), .85);
  }
  // street trees
  for (const zs of zStreets) for (let x = -half(zs - ROAD.z); x < half(zs - ROAD.z); x += 13) {
    if (rand() < .45) plant(x + R(-2, 2), zs + (rand() < .5 ? 1 : -1) * (zs === ROAD.z ? 9 : 5.5));
  }
  for (const xs of xStreets) for (let z = ROAD.z - half(xs); z < ROAD.z + half(xs); z += 13) {
    if (rand() < .4) plant(xs + (rand() < .5 ? 1 : -1) * 5.5, z + R(-2, 2));
  }
  // around the plot: a screen of trees and palms behind it, rows down both sides, framing in front
  for (let x = -36; x <= 36; x += 7.5) { if (rand() < .3) palm(x + R(-2, 2), PLOT.z0 - R(5, 14), true); else tree(x + R(-2, 2), PLOT.z0 - R(5, 14), 1.05, true); }
  for (const s of [-1, 1]) {
    for (let z = PLOT.z0 + 2; z < PLOT.z1 + 2; z += 7) { if (rand() < .75) tree(s * (PLOT.w / 2 + R(3.5, 7)), z + R(-2, 2), .8, true); }
    for (let z = PLOT.z0; z < PLOT.z1 + 4; z += 2.6) { if (rand() < .6) bush(s * (PLOT.w / 2 + R(1.4, 3)), z + R(-1, 1)); }
    tree(s * R(45, 49), ROAD.z + R(30, 34), .8, true);
    for (let i = 0; i < 5; i++) bush(s * R(30, 46), ROAD.z + R(9, 26));
  }
  // infill inside the town, then scatter thinning out across the plain
  for (let i = 0, n = Math.round(4200 * q.detail); i < n; i++) { const a = R(0, Math.PI * 2), r = (TOWN_R + 120) * Math.sqrt(rand()); plant(Math.cos(a) * r, ROAD.z + Math.sin(a) * r); }
  // out on the plain the trees gather in groves and thin with distance
  for (let i = 0, n = Math.round(15000 * q.detail); i < n; i++) {
    const a = R(0, Math.PI * 2), r = 300 + 4200 * Math.pow(rand(), 1.5), x = Math.cos(a) * r, z = Math.sin(a) * r;
    const grove = Math.sin(x * .0041 + 1.3) * Math.sin(z * .0037 + .5) + Math.sin((x + z) * .0019);
    if (grove > R(-1.1, 1.5)) tree(x, z, R(.8, 1.25));
  }

  // ---- Plot boundary: concrete posts with three wires, and a kerb with a gap at the entrance ----
  const F = { post: batch(), wire: batch(), kerb: batch() };
  const POST = col('#ebe8e1'), WIRE = col('#8b9094'), KERB = col('#c8c5bc');
  const hw = PLOT.w / 2, GATE = 5;
  const fence = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 3)), alongX = z0 === z1;
    for (let i = 0; i <= n; i++) F.post.add(lerpN(x0, x1, i / n), 0, lerpN(z0, z1, i / n), .16, 1.5, .16, POST);
    for (const y of [.45, .85, 1.25]) F.wire.add((x0 + x1) / 2, y, (z0 + z1) / 2, alongX ? len : .03, .03, alongX ? .03 : len, WIRE);
  };
  fence(-hw, PLOT.z0, -hw, PLOT.z1); fence(hw, PLOT.z0, hw, PLOT.z1); fence(-hw, PLOT.z0, hw, PLOT.z0);
  fence(-hw, PLOT.z1, -GATE, PLOT.z1); fence(GATE, PLOT.z1, hw, PLOT.z1);
  const kz = ROAD.z - ROAD.w / 2 - .5;
  for (const s of [-1, 1]) F.kerb.add(s * (GATE + 1 + 197), 0, kz, 394, .17, .42, KERB);
  F.kerb.add(0, 0, ROAD.z + ROAD.w / 2 + .5, 800, .17, .42, KERB);

  // ---- Instanced meshes ----
  const box = new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0);
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 10).translate(0, .5, 0);
  const paint = std(), leaf = leafMaterial(noise);
  B.bodyNear.build(group, box, paint, true, true);
  B.body.build(group, box, paint);
  B.slab.build(group, box, paint, true, true);
  B.wall.build(group, box, paint, true, true);
  B.tank.build(group, cyl, std({ roughness: .7 }), true);
  B.window.build(group, box, std({ roughness: .35 }));
  T.trunk.build(group, new THREE.CylinderGeometry(.7, 1, 1, 7).translate(0, .5, 0), paint, true);
  T.canopyNear.build(group, canopyGeometry(q.tier === 'high' ? 3 : 2), leaf, true, true);
  T.canopyMid.build(group, canopyGeometry(1), leaf);
  T.canopyFar.build(group, canopyGeometry(0), leaf);
  T.palmTrunk.build(group, new THREE.CylinderGeometry(.7, 1, 1, 7).translate(0, .5, 0), paint, true);
  T.palmCrown.build(group, palmCrown(), std({ roughness: 1, side: THREE.DoubleSide }), true);
  F.post.build(group, box, paint, true);
  F.wire.build(group, box, std({ roughness: .6 }));
  F.kerb.build(group, box, paint, false, true);

  return { group, noise };
}

const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
