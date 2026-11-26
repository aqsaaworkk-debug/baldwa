import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Procedural 3D model of the client's bed (drawings "01 Front elevation" and "02 Top plan", render in
// public/images/projects/stages/bed-*.webp), for its featured-project card and the interactive viewer.
// Metres; y up; the wall is at z = 0 and the bed points to +z; x = 0 is the bed's centre line.
//
// From the drawings (inches): headboard 112" overall and 58" to the top, in three parts: 18" cane panels (B) either side
// of a 76" slatted centre (A) with brass corner plates; it rests on 19" bedside units (C), 16" deep from the wall, two
// drawers each. Bed frame 76" x 82" on a dark recessed plinth, 72" x 78" mattress. Bedding follows the client's render.
// Not dimensioned, so judged from the drawings: headboard depth, slat size and count, frame border, bedding.

const IN = 0.0254;
const W = 112 * IN, TOP = 58 * IN, SIDE = 18 * IN, MID = 76 * IN, UNIT_H = 19 * IN, UNIT_D = 16 * IN;
const FRAME_L = 82 * IN, MAT_W = 72 * IN, MAT_L = 78 * IN;
const HB_D = 2.5 * IN;       // headboard depth (judged)
const BORDER = 1.4 * IN;     // dark frame around the headboard
const RADIUS = 7 * IN;       // rounded top corners

export type BedModel = { root: THREE.Group; dispose: () => void };

// woven cane: a small repeating tile drawn on a canvas
function caneTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d')!;
  x.fillStyle = '#c9a779'; x.fillRect(0, 0, 64, 64);
  x.strokeStyle = '#b89668'; x.lineWidth = 3;
  for (let i = -64; i <= 128; i += 16) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 64, 64); x.stroke();
    x.beginPath(); x.moveTo(i + 64, 0); x.lineTo(i, 64); x.stroke();
  }
  x.fillStyle = '#a07e55';
  for (let yy = 8; yy < 64; yy += 16) for (let xx = 0; xx < 64; xx += 16) { x.beginPath(); x.arc(xx + 8, yy, 2.6, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(xx, yy + 8, 2.6, 0, Math.PI * 2); x.fill(); }
  x.strokeStyle = '#d9bc90'; x.lineWidth = 1;
  for (let i = 0; i < 64; i += 4) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 64); x.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

export function buildBed(): BedModel {
  const root = new THREE.Group();
  const geos: THREE.BufferGeometry[] = [];
  const g = <G extends THREE.BufferGeometry>(x: G) => (geos.push(x), x);
  const cane = caneTexture();

  const espresso = new THREE.MeshStandardMaterial({ color: '#2f231b', roughness: 0.55 });
  const backing = new THREE.MeshStandardMaterial({ color: '#8f6d53', roughness: 0.7 });
  const slat = new THREE.MeshStandardMaterial({ color: '#2a1f18', roughness: 0.5 });
  const caneMat = new THREE.MeshStandardMaterial({ map: cane, roughness: 0.85 });
  const brass = new THREE.MeshStandardMaterial({ color: '#e2b24a', roughness: 0.4, metalness: 0.7 });
  const lacquer = new THREE.MeshStandardMaterial({ color: '#efebe5', roughness: 0.38 });
  const walnut = new THREE.MeshStandardMaterial({ color: '#8b6446', roughness: 0.5 });
  const groove = new THREE.MeshStandardMaterial({ color: '#b9b1a6', roughness: 0.6 });
  const fabric = new THREE.MeshStandardMaterial({ color: '#e6ddd0', roughness: 0.95 });
  const sheet = new THREE.MeshStandardMaterial({ color: '#f1ece4', roughness: 0.95 });
  const duvet = new THREE.MeshStandardMaterial({ color: '#cdbfae', roughness: 1 });
  const throwMat = new THREE.MeshStandardMaterial({ color: '#2d2c2b', roughness: 1 });
  const mats = [espresso, backing, slat, caneMat, brass, lacquer, walnut, groove, fabric, sheet, duvet, throwMat];

  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); root.add(mesh); return mesh;
  };
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => add(g(new THREE.BoxGeometry(w, h, d)), m, x, y, z);
  const soft = (w: number, h: number, d: number, r: number, m: THREE.Material, x: number, y: number, z: number) => add(g(new RoundedBoxGeometry(w, h, d, 4, r)), m, x, y, z);

  // ---------- headboard: dark frame with rounded top corners, from the top of the bedside units to 58" ----------
  {
    const h = TOP - UNIT_H, s = new THREE.Shape();
    s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, h - RADIUS);
    s.quadraticCurveTo(W / 2, h, W / 2 - RADIUS, h); s.lineTo(-W / 2 + RADIUS, h);
    s.quadraticCurveTo(-W / 2, h, -W / 2, h - RADIUS); s.lineTo(-W / 2, 0);
    add(g(new THREE.ExtrudeGeometry(s, { depth: HB_D, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 24 })), espresso, 0, UNIT_H, 0);
    // the slatted centre continues down to the floor behind the bed
    box(MID, UNIT_H, HB_D, espresso, 0, UNIT_H / 2, HB_D / 2);
  }
  const front = HB_D + 0.012; // just in front of the frame's bevelled face (HB_D + 0.004), so the panels never z-fight with it
  // cane side panels (B), just proud of the frame so the dark border shows around them; the outer top corner follows the
  // frame's curve. Drawn in world x/y, so the cane texture repeats at the same size on both.
  {
    const r = RADIUS - BORDER, y0 = UNIT_H + BORDER, y1 = TOP - BORDER;
    const tex = cane.clone(); tex.needsUpdate = true; tex.repeat.set(1 / (2.4 * IN), 1 / (2.4 * IN));
    const m = caneMat.clone(); m.map = tex; mats.push(m);
    for (const sx of [-1, 1]) {
      const inner = sx * (MID / 2 + 0.3 * IN), outer = sx * (W / 2 - BORDER);
      const sh = new THREE.Shape();
      sh.moveTo(inner, y0); sh.lineTo(outer, y0); sh.lineTo(outer, y1 - r);
      sh.quadraticCurveTo(outer, y1, outer - sx * r, y1); sh.lineTo(inner, y1); sh.lineTo(inner, y0);
      const geo = g(new THREE.ShapeGeometry(sh, 16));
      add(geo, m, 0, 0, front);
    }
  }
  // slatted centre (A): tan backing, dark slats in front, dark posts at both sides with brass corner plates
  {
    const y0 = 0.05, y1 = TOP - BORDER, h = y1 - y0;
    box(MID - 2 * IN, h, 0.01, backing, 0, y0 + h / 2, front);
    const n = 23, sw = 1.55 * IN, span = MID - 4 * IN;
    for (let i = 0; i < n; i++) box(sw, h, 1.1 * IN, slat, -span / 2 + (i + 0.5) * (span / n), y0 + h / 2, front + 0.55 * IN);
    for (const sx of [-1, 1]) {
      const px = sx * (MID / 2 - 1 * IN);
      box(2 * IN, h, 1.3 * IN, espresso, px, y0 + h / 2, front + 0.65 * IN);
      for (const py of [TOP - 2.6 * IN, 35.5 * IN]) box(2.1 * IN, 1.7 * IN, 0.25 * IN, brass, px, py, front + 1.35 * IN);
    }
  }

  // ---------- bedside units (C): white lacquer, two drawers, walnut top, a walnut strip on the bed side ----------
  for (const sx of [-1, 1]) {
    const cx = sx * (MID / 2 + SIDE / 2), zc = UNIT_D / 2;
    box(SIDE, UNIT_H - 1.2 * IN, UNIT_D, lacquer, cx, (UNIT_H - 1.2 * IN) / 2, zc);
    box(SIDE + 0.4 * IN, 1.2 * IN, UNIT_D + 0.4 * IN, walnut, cx, UNIT_H - 0.6 * IN, zc);
    box(SIDE - 0.4 * IN, 0.12 * IN, 0.2 * IN, groove, cx, (UNIT_H - 1.2 * IN) / 2, UNIT_D + 0.05 * IN);
    box(0.9 * IN, UNIT_H - 2.2 * IN, 0.35 * IN, walnut, cx - sx * (SIDE / 2 - 1.4 * IN), (UNIT_H - 1.2 * IN) / 2, UNIT_D + 0.1 * IN);
  }

  // ---------- bed: dark recessed plinth, upholstered frame, mattress, headrest cushion ----------
  const z0 = HB_D + 0.01, zMid = z0 + FRAME_L / 2;
  box(MID - 6 * IN, 3.6 * IN, FRAME_L - 6 * IN, espresso, 0, 1.8 * IN, zMid);
  soft(MID, 8 * IN, FRAME_L, 1.2 * IN, fabric, 0, 3.6 * IN + 4 * IN, zMid);
  soft(MAT_W, 8 * IN, MAT_L, 2 * IN, sheet, 0, 11.6 * IN + 4 * IN, zMid);
  soft(MAT_W + 2 * IN, 12 * IN, 3.2 * IN, 1.4 * IN, fabric, 0, 19.6 * IN + 6 * IN - 1 * IN, z0 + 1.8 * IN);

  // ---------- bedding, after the render: pillows, cushions, duvet, dark throw ----------
  const pillow = (x: number, z: number, w: number, m: THREE.Material, tilt: number, h = 6.5 * IN, d = 18 * IN) => {
    const p = soft(w, h, d, 2.6 * IN, m, x, 19.6 * IN + h / 2 + 2 * IN, z); p.rotation.x = tilt; return p;
  };
  pillow(-17 * IN, z0 + 10 * IN, 27 * IN, sheet, -0.5);
  pillow(17 * IN, z0 + 10 * IN, 27 * IN, sheet, -0.5);
  pillow(-9 * IN, z0 + 18 * IN, 18 * IN, sheet, -0.35, 6 * IN, 11 * IN);
  pillow(9 * IN, z0 + 18 * IN, 13 * IN, throwMat, -0.35, 6 * IN, 11 * IN);
  const dz0 = z0 + 26 * IN, dLen = FRAME_L - 26 * IN + 3 * IN;
  soft(MID + 3 * IN, 2.6 * IN, dLen, 1.2 * IN, duvet, 0, 19.6 * IN + 1.3 * IN, dz0 + dLen / 2);
  // the duvet falls over the sides and the foot
  soft(1.2 * IN, 10 * IN, dLen, 0.5 * IN, duvet, -(MID + 3 * IN) / 2, 20 * IN - 5 * IN, dz0 + dLen / 2);
  soft(1.2 * IN, 10 * IN, dLen, 0.5 * IN, duvet, (MID + 3 * IN) / 2, 20 * IN - 5 * IN, dz0 + dLen / 2);
  soft(MID + 3 * IN, 10 * IN, 1.2 * IN, 0.5 * IN, duvet, 0, 20 * IN - 5 * IN, dz0 + dLen);
  soft(MID + 4 * IN, 1.4 * IN, 15 * IN, 0.6 * IN, throwMat, 0, 19.6 * IN + 2.6 * IN + 0.5 * IN, dz0 + 9 * IN);

  root.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { root, dispose: () => { geos.forEach((x) => x.dispose()); mats.forEach((m) => { (m as THREE.MeshStandardMaterial).map?.dispose(); m.dispose(); }); } };
}
