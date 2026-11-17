// Builds the 3D floor-plan model of the walkthrough section from src/data/floorplan.ts.
//
// The client's rendered plan is the texture of everything that has a look of its own: the floor
// slab, and every furniture piece, which is a simple solid whose top shows its part of the plan
// and whose sides continue the colours at its edge (planar projection from above). Walls, glass,
// doors, plants and lamps are plain materials.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DOORS, GLASS, LAMPS, LIFT, PIECES, PLAN, PLANTS, WALLS } from '@/data/floorplan';

const S = PLAN.scale;
const TALL = 1.3; // furniture is raised a little more than life, so the model reads as 3D from every angle
export const wx = (px: number) => (px - PLAN.centre.x) / S;
export const wz = (py: number) => (py - PLAN.centre.y) / S;

// UVs from above: each vertex shows the plan pixel under it. Vertices of side faces sample a
// few pixels inside the piece, so they take the piece's own colour, not the floor next to it.
function project(g: THREE.BufferGeometry, inset = 3 / S) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), z = p.getZ(i);
    if (Math.abs(n.getY(i)) < .5) { x -= n.getX(i) * inset; z -= n.getZ(i) * inset; }
    uv.setXY(i, (x * S + PLAN.centre.x - PLAN.crop.x) / PLAN.crop.w, 1 - (z * S + PLAN.centre.y - PLAN.crop.y) / PLAN.crop.h);
  }
  return g;
}

const boxGeo = (x0: number, y0: number, x1: number, y1: number, h: number, base = 0) =>
  new THREE.BoxGeometry((x1 - x0) / S, h, (y1 - y0) / S).translate(wx((x0 + x1) / 2), base + h / 2, wz((y0 + y1) / 2));

export function buildPlanModel(map: THREE.Texture) {
  const root = new THREE.Group();
  const M = (c: string, r = .85, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
  const mat = {
    plan: new THREE.MeshStandardMaterial({ map, roughness: .82 }),
    wall: M('#f2ede5', .9), edge: M('#e4dccf', .9), lift: M('#8d9096', .6, { metalness: .3 }), wood: M('#b07a4e', .6),
    glass: M('#a9d6ee', .08, { transparent: true, opacity: .3, depthWrite: false }),
    well: M('#d9d2c6', 1, { side: THREE.BackSide }), leaf: M('#6f9148', .9, { flatShading: true }), pot: M('#d8cdbd', .9),
    lamp: new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffbf73', emissiveIntensity: 0, roughness: .4 }),
  };
  const add = (geos: THREE.BufferGeometry[], m: THREE.Material | THREE.Material[], shadow = true) => {
    const mesh = new THREE.Mesh(geos.length === 1 ? geos[0] : mergeGeometries(geos, false), m);
    mesh.castShadow = shadow; mesh.receiveShadow = true; root.add(mesh); return mesh;
  };

  // floor slab with the plan on top; openings for the void and the staircase
  const shape = new THREE.Shape(PLAN.outline.map(([x, y]) => new THREE.Vector2(wx(x), wz(y))));
  PLAN.wells.forEach((w) => shape.holes.push(new THREE.Path([[w.x0, w.y0], [w.x1, w.y0], [w.x1, w.y1], [w.x0, w.y1]].map(([x, y]) => new THREE.Vector2(wx(x), wz(y))))));
  const slab = new THREE.ExtrudeGeometry(shape, { depth: .45, bevelEnabled: false }).rotateX(Math.PI / 2);
  add([project(slab, 0)], [mat.plan, mat.edge], false);
  PLAN.wells.forEach((w) => { const m = new THREE.Mesh(boxGeo(w.x0, w.y0, w.x1, w.y1, w.depth - .02, -w.depth), mat.well); m.receiveShadow = true; root.add(m); });

  // furniture, textured from the plan
  const st = PLAN.stairs;
  const solids = PIECES.map((p) => {
    if (p.t === 'box') return boxGeo(...p.r, p.h * TALL, (p.base ?? 0) * TALL);
    if (p.t === 'cyl') return new THREE.CylinderGeometry(p.rad / S, p.rad / S, p.h * TALL, 28).translate(wx(p.x), ((p.base ?? 0) + p.h / 2) * TALL, wz(p.y));
    return new THREE.BoxGeometry(p.w / S, p.h * TALL, p.d / S).rotateY(p.rot).translate(wx(p.x), p.h * TALL / 2, wz(p.y));
  });
  for (let i = 0; i < st.steps; i++) solids.push(boxGeo(st.x0, st.yTop - (i + 1) * st.tread, st.x1, st.yTop - i * st.tread, st.rise, -(i + 2) * st.rise));
  add(solids.map((g) => project(g)), mat.plan);

  add(WALLS.map((r) => boxGeo(...r, PLAN.wall)), mat.wall);
  add(LIFT.map((r) => boxGeo(...r, PLAN.wall)), mat.lift);
  add(GLASS.map(([x0, y0, x1, y1, h]) => boxGeo(x0, y0, x1, y1, h)), mat.glass, false);
  add(DOORS.map(([ax, ay, bx, by]) => {
    const len = Math.hypot(bx - ax, by - ay) / S;
    return new THREE.BoxGeometry(len, PLAN.wall - .1, .05).rotateY(-Math.atan2(by - ay, bx - ax)).translate(wx((ax + bx) / 2), (PLAN.wall - .1) / 2, wz((ay + by) / 2));
  }), mat.wood);

  add(PLANTS.map(([x, y, b]) => new THREE.CylinderGeometry(.11, .085, .2, 12).translate(wx(x), b * TALL + .1, wz(y))), mat.pot);
  add(PLANTS.flatMap(([x, y, b], i) => [0, 1, 2].map((k) => {
    const a = i * 1.7 + k * 2.1;
    return new THREE.IcosahedronGeometry(.13 + (k === 0 ? .05 : 0), 0).translate(wx(x) + Math.cos(a) * .07 * k, b * TALL + .32 + k * .07, wz(y) + Math.sin(a) * .07 * k);
  })), mat.leaf);
  add(LAMPS.map(([x, y]) => new THREE.SphereGeometry(.1, 16, 12).translate(wx(x), .5 * TALL + .12, wz(y))), mat.lamp, false);

  return { root, lamp: mat.lamp, glass: mat.glass };
}

// Soft round shadow under the model, so it sits on the stage.
export function groundShadow() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 30, 128, 128, 128);
  grad.addColorStop(0, 'rgba(2,4,14,.75)'); grad.addColorStop(.6, 'rgba(2,4,14,.35)'); grad.addColorStop(1, 'rgba(2,4,14,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
