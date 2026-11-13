// Builds the static parts of one villa floor: site (ground floor only), walls generated from
// the room rectangles, and furniture. Room floor slabs are rendered separately as R3F meshes
// in VillaScene.tsx so they can respond to hover and click.
import * as THREE from 'three';
import { rng } from './scenes';
import { villa, floors, doors, type FloorKey, type Room, type RoomKind } from '@/data/villa';

// Plan feet → centred world units
export const toX = (x: number) => x - villa.width / 2;
export const toZ = (z: number) => z - villa.depth / 2;

export const FLOOR_COLOR: Record<string, string> = { wood: '#a07a58', stone: '#ddd7cd', tile: '#c3c8c9', deck: '#a77d58', court: '#cdbfa6' };
const FINISH: Partial<Record<RoomKind, keyof typeof FLOOR_COLOR>> = {
  bed: 'wood', master: 'wood', family: 'wood', theatre: 'wood', nook: 'wood', dress: 'wood', linen: 'wood', study: 'wood',
  living: 'stone', dining: 'stone', foyer: 'stone', stair: 'stone', puja: 'stone',
  kitchen: 'tile', bath: 'tile', mbath: 'tile', powder: 'tile',
  court: 'court', verandah: 'deck', pool: 'deck', terrace: 'deck', balcony: 'deck',
};
export const floorColor = (k: RoomKind) => FLOOR_COLOR[FINISH[k] ?? 'stone'];

export const WALL_HEIGHT = 4.2; // walls are cut at 4.2 ft so rooms stay visible

function materials() {
  const S = (c: string, r = .85, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
  return {
    wall: S('#f4f2ee', .9), glass: S('#a9d0de', .08, { transparent: true, opacity: .26, depthWrite: false }), dark: S('#262628', .6),
    fabric: S('#e9e3d7', .95), fabric2: S('#b9a68a', .95), fabricDark: S('#3b3734', .9), linen: S('#fbf8f2', .95),
    wood: S('#8a6245', .7), woodDark: S('#4a3427', .7), counter: S('#ebe8e2', .4), metal: S('#bdbdb8', .35, { metalness: .6 }),
    gold: S('#f5b21a', .35, { metalness: .7 }), water: S('#4f9fb6', .12, { metalness: .25 }), leaf: S('#5f7044', .95, { flatShading: true }),
    pot: S('#cdbfae', .9), rug: S('#d9cebc', 1), rugDark: S('#2d2a28', 1), white: S('#ffffff', .45),
    site: S('#cbc2b1', 1), grass: S('#7b8a55', 1), road: S('#a59c8c', 1),
  };
}
type MT = ReturnType<typeof materials>;

export function buildFloorModel(key: FloorKey): THREE.Group {
  const MT = materials();
  const rooms = floors[key];
  const first = key === 'first';
  const g = new THREE.Group();

  const b = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
    const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    me.position.set(toX(x), y + h / 2, toZ(z)); me.castShadow = !(m as THREE.MeshStandardMaterial).transparent; me.receiveShadow = true; g.add(me); return me;
  };
  const c = (r: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 14) => {
    const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
    me.position.set(toX(x), y + h / 2, toZ(z)); me.castShadow = true; me.receiveShadow = true; g.add(me); return me;
  };
  const plant = (x: number, z: number, s = 1) => {
    c(.75 * s, 1.3 * s, MT.pot, x, 0, z, 12);
    const l = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25 * s, 0), MT.leaf);
    l.position.set(toX(x), 2.3 * s, toZ(z)); l.castShadow = true; g.add(l);
  };
  const bigTree = (x: number, z: number, s: number) => {
    c(.35 * s, 3.5 * s, MT.woodDark, x, 0, z, 8);
    const rand = rng((x * 13 + z * 7 + 5) | 0);
    for (let i = 0; i < 4; i++) {
      const l = new THREE.Mesh(new THREE.IcosahedronGeometry((2 + rand() * 1.2) * s, 0), MT.leaf);
      l.position.set(toX(x) + (rand() - .5) * 2.6 * s, (4 + rand() * 1.5) * s, toZ(z) + (rand() - .5) * 2.6 * s);
      l.castShadow = true; g.add(l);
    }
  };

  if (!first) { // site, road, garden, compound wall
    b(92, .3, 74, MT.site, 30, -.75, 22); b(92, .32, 9, MT.road, 30, -.76, 61); b(8, .31, 16, MT.road, 7, -.74, 48);
    [[-10, -8], [-12, 10], [-10, 34], [70, -6], [71, 16], [-12, 52], [72, 52], [36, 54]].forEach((p) => bigTree(p[0], p[1], .95 + ((p[0] + p[1]) % 3) * .08));
    b(30, .1, 8, MT.grass, 30, -.45, 50); b(10, .1, 40, MT.grass, -8, -.45, 20); b(10, .1, 40, MT.grass, 68, -.45, 20);
    b(92, 1.2, .5, MT.wall, 30, -.45, -15); b(.5, 1.2, 74, MT.wall, -16, -.45, 22); b(.5, 1.2, 74, MT.wall, 76, -.45, 22); b(72, 1.2, .5, MT.wall, 40, -.45, 57.6);
  }

  buildWalls(key, rooms, MT, b);
  rooms.forEach((r) => furnish(r, MT, b, c, plant, bigTree));
  return g;
}

type BoxFn = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => THREE.Mesh;
type CylFn = (r: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg?: number) => THREE.Mesh;

// Rasterise rooms onto a 1 ft grid and draw a wall wherever two neighbouring cells differ.
function buildWalls(key: FloorKey, rooms: Room[], MT: MT, b: BoxFn) {
  const first = key === 'first';
  const W = villa.width, D = villa.depth;
  const cell = new Int16Array(W * D).fill(-1);
  rooms.forEach((r, i) => { for (let x = r.x0; x < r.x1; x++) for (let z = r.z0; z < r.z1; z++) cell[x * D + z] = i; });
  const at = (x: number, z: number) => (x < 0 || z < 0 || x >= W || z >= D ? -1 : cell[x * D + z]);

  type Seg = { key: string; a: number; b: number; o: 'h' | 'v'; line: number; s: number; e: number };
  const segs: Seg[] = [];
  const scan = (o: 'h' | 'v') => {
    const outer = o === 'h' ? D : W, inner = o === 'h' ? W : D;
    for (let L = 0; L <= outer; L++) {
      let run: Seg | null = null;
      for (let i = 0; i <= inner; i++) {
        const a = i < inner ? (o === 'h' ? at(i, L - 1) : at(L - 1, i)) : 0;
        const bb = i < inner ? (o === 'h' ? at(i, L) : at(L, i)) : 0;
        const k = i < inner && a !== bb ? `${a}|${bb}` : null;
        if (run && k === run.key) { run.e = i + 1; continue; }
        if (run) { segs.push(run); run = null; }
        if (k) run = { key: k, a, b: bb, o, line: L, s: i, e: i + 1 };
      }
    }
  };
  scan('h'); scan('v');

  const isOpen = (i: number) => i < 0 || rooms[i].open;
  const kindOf = (i: number) => (i < 0 ? 'out' : rooms[i].kind);
  const idOf = (i: number) => (i < 0 ? 'out' : rooms[i].id);
  const doorWidth = (A: number, B: number) => {
    const d = doors[key].find((p) => (p[0] === idOf(A) && p[1] === idOf(B)) || (p[1] === idOf(A) && p[0] === idOf(B)));
    return d ? (d[2] ?? 3) : 0;
  };

  segs.forEach((sg) => {
    const A = sg.a, B = sg.b;
    let type: 'rail' | 'ext' | 'glass' | 'int' | null = null, gap = 0;
    if (isOpen(A) && isOpen(B)) {
      if (first) { const ks = [kindOf(A), kindOf(B)]; if (!(ks.includes('void') && ks.includes('out'))) type = 'rail'; }
    } else if (isOpen(A) || isOpen(B)) {
      const o = isOpen(A) ? A : B;
      if (o < 0) { type = 'ext'; gap = doorWidth(A, B); }
      else if (rooms[o].kind === 'void') type = 'glass';
      else { type = 'glass'; gap = sg.e - sg.s >= 6 ? 4 : 0; }
    } else { type = 'int'; gap = doorWidth(A, B); }
    if (!type) return;

    const H = type === 'rail' ? 1.3 : WALL_HEIGHT;
    const th = type === 'ext' ? .6 : type === 'int' ? .45 : .16;
    const mat = type === 'glass' || type === 'rail' ? MT.glass : MT.wall;
    const L = sg.e - sg.s, mid = (sg.s + sg.e) / 2;
    let parts: [number, number][] = [[sg.s, sg.e]];
    if (gap && L >= gap + 2) parts = [[sg.s, mid - gap / 2], [mid + gap / 2, sg.e]];
    parts.forEach(([p0, p1]) => {
      const len = p1 - p0; if (len <= 0) return;
      const m2 = (p0 + p1) / 2;
      if (sg.o === 'h') { b(len + th, H, th, mat, m2, 0, sg.line); if (mat === MT.glass) b(len + th, .14, .22, MT.dark, m2, H - .14, sg.line); }
      else { b(th, H, len + th, mat, sg.line, 0, m2); if (mat === MT.glass) b(.22, .14, len + th, MT.dark, sg.line, H - .14, m2); }
    });
  });
}

// Furniture per room kind. Add a case when you add a new kind in src/data/villa.ts.
function furnish(r: Room, MT: MT, b: BoxFn, c: CylFn, plant: (x: number, z: number, s?: number) => void, bigTree: (x: number, z: number, s: number) => void) {
  const w = r.x1 - r.x0, d = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, k = r.kind;
  const bed = (bw: number) => {
    const bl = 7, z0 = r.z0 + .6;
    b(bw + 3, .06, bl + 1.5, MT.rug, cx, 0, z0 + bl / 2 + .6); b(bw + 1, 3, .4, MT.woodDark, cx, 0, z0);
    b(bw, 1.5, bl, MT.fabric, cx, 0, z0 + .2 + bl / 2); b(bw - .1, .3, bl - 2.2, MT.fabric2, cx, 1.5, z0 + 2.4 + (bl - 2.2) / 2);
    b(bw / 2 - .4, .5, 1.2, MT.linen, cx - bw / 4, 1.5, z0 + 1.1); b(bw / 2 - .4, .5, 1.2, MT.linen, cx + bw / 4, 1.5, z0 + 1.1);
    [-1, 1].forEach((s) => b(1.5, 1.7, 1.5, MT.wood, cx + s * (bw / 2 + 1.2), 0, z0 + 1));
  };
  switch (k) {
    case 'bed': case 'master':
      bed(k === 'master' ? 7 : 6); b(1.8, 4, w * .5, MT.wood, r.x1 - 1.3, 0, r.z1 - w * .25 - 1.2); plant(r.x0 + 1.6, r.z1 - 1.6);
      if (k === 'master') { b(3, 1.6, 3, MT.fabric2, r.x0 + 3, 0, r.z1 - 3.5); b(1.6, 1.2, 1.6, MT.gold, r.x0 + 5.2, 0, r.z1 - 2.6); }
      break;
    case 'living': case 'family': {
      const sw = Math.min(11, w - 6);
      b(sw + 3, .06, Math.min(10, d - 5), MT.rug, cx, 0, cz + .5); b(sw, 1.5, 3, MT.fabric, cx, 0, cz + 3.6); b(sw, 2.6, .8, MT.fabric, cx, 0, cz + 5.2);
      b(3, 1.5, 5, MT.fabric, cx - sw / 2 + 1.5, 0, cz + .4); b(4.2, 1.1, 2.4, MT.woodDark, cx + .8, 0, cz);
      b(Math.min(9, w - 4), 1.5, 1.3, MT.wood, cx, 0, r.z0 + 1.1); b(Math.min(6, w - 6), 3.2, .25, MT.dark, cx, 1.5, r.z0 + 1.1);
      b(2.8, 1.6, 2.8, MT.fabric2, cx + sw / 2 - .5, 0, cz - 2);
      if (k === 'living') { b(2.8, 1.6, 2.8, MT.fabric2, cx + sw / 2 + 3, 0, cz - 2); plant(r.x1 - 1.8, r.z1 - 1.8, 1.2); plant(r.x0 + 1.8, r.z0 + 2, 1); }
      else plant(r.x1 - 1.6, r.z1 - 1.6);
      break;
    }
    case 'dining':
      b(9, 2.5, 3.8, MT.wood, cx, 0, cz);
      for (let i = -1; i <= 1; i++) [-1, 1].forEach((s) => { b(1.4, 1.5, 1.4, MT.fabric2, cx + i * 2.8, 0, cz + s * 2.9); b(1.4, 3.1, .25, MT.fabric2, cx + i * 2.8, 0, cz + s * 3.6); });
      c(.15, .15, MT.gold, cx - 2.5, 2.5, cz); c(.15, .15, MT.gold, cx + 2.5, 2.5, cz); b(6, 3, 1.2, MT.woodDark, cx, 0, r.z0 + .9); plant(r.x1 - 1.6, r.z1 - 1.6);
      break;
    case 'kitchen':
      b(w - 4, 3, 2, MT.counter, cx - 1, 0, r.z0 + 1.2); b(2, 3, d - 5, MT.counter, r.x0 + 1.2, 0, cz + 1.2); b(2.6, 4.2, 2.2, MT.metal, r.x1 - 1.6, 0, r.z0 + 1.4);
      b(6, 3, 2.6, MT.woodDark, cx + 1, 0, cz + 2); b(6.2, .15, 2.8, MT.counter, cx + 1, 3, cz + 2);
      [-1.5, 0, 1.5].forEach((o) => c(.5, 2, MT.fabricDark, cx + 1 + o * 1.3, 0, cz + 3.9, 10));
      break;
    case 'bath': case 'mbath': case 'powder': {
      const vw = Math.min(4.5, w - 3);
      b(vw, 2.7, 1.8, MT.wood, r.x0 + vw / 2 + .8, 0, r.z0 + 1.2); b(1.4, 1.5, 2, MT.white, r.x1 - 1.2, 0, cz + 1);
      if (k !== 'powder') { b(3.4, .15, 3.4, MT.counter, r.x0 + 2.2, 0, r.z1 - 2.2); b(.1, 4, 3.4, MT.glass, r.x0 + 4, 0, r.z1 - 2.2); }
      if (k === 'mbath') b(2.6, 1.8, 5.4, MT.white, r.x1 - 1.8, 0, r.z1 - 3.2);
      break;
    }
    case 'stair': {
      const n = 14, sd = (d - 2) / n;
      for (let i = 0; i < n; i++) b(w - 1.2, Math.min(4.2, (i + 1) * .3), sd, MT.counter, cx, 0, r.z1 - 1 - sd / 2 - i * sd);
      b(.12, 4.2, d - 2, MT.glass, r.x1 - .4, 0, cz);
      break;
    }
    case 'puja':
      b(4.6, 2.2, 1.8, MT.woodDark, cx, 0, r.z0 + 1.3); b(2.4, 1.4, .9, MT.gold, cx, 2.2, r.z0 + 1.2);
      c(.3, .3, MT.gold, cx - 1.6, 2.2, r.z0 + 1.8); c(.3, .3, MT.gold, cx + 1.6, 2.2, r.z0 + 1.8); b(4, .06, 3, MT.rug, cx, 0, cz + 1.2);
      break;
    case 'court':
      b(w - 3, .12, d - 3, MT.grass, cx, 0, cz); bigTree(cx - 1, cz - 1, .85); c(1.2, .5, MT.water, cx + 3, 0, cz + 3.5, 20); b(5, 1.3, 1.4, MT.counter, cx, 0, r.z1 - 1.4);
      break;
    case 'verandah': // jhoola (swing), daybed, planters
      b(5.2, 1.1, 2.2, MT.wood, cx - 6, 1.4, cz); [-2.4, 2.4].forEach((o) => b(.08, 1.6, .08, MT.metal, cx - 6 + o, 2.5, cz)); b(5.6, .2, .3, MT.woodDark, cx - 6, 4.1, cz);
      b(7, 1.3, 2.8, MT.fabric, cx + 4, 0, cz + 1.5); b(3, 1, 2, MT.wood, cx + 4, 0, cz - 1.6);
      for (let i = 0; i < 5; i++) plant(r.x0 + 3 + i * 5.6, r.z1 - 1.4, .75);
      break;
    case 'pool':
      b(12, .14, 7, MT.water, cx + 1, 0, cz + 2.4); b(12.8, .12, 7.8, MT.counter, cx + 1, -.02, cz + 2.4);
      [-4, 0, 4].forEach((o) => b(1.8, .6, 4.2, MT.white, cx + 1 + o, 0, r.z0 + 3.4));
      plant(r.x1 - 1.6, r.z1 - 1.6, 1.1); plant(r.x0 + 1.6, r.z1 - 1.6, 1);
      break;
    case 'study':
      b(4.6, 2.5, 2.2, MT.wood, cx, 0, r.z0 + 1.4); b(1.8, 2, 1.8, MT.fabricDark, cx, 0, r.z0 + 3.4); b(1.2, 4, d - 2, MT.woodDark, r.x1 - .9, 0, cz);
      break;
    case 'nook':
      b(1.2, 4, d - 4, MT.woodDark, r.x0 + .9, 0, cz); b(2.8, 1.6, 2.8, MT.fabric2, cx + .8, 0, cz - 2.5); b(2.8, 1.6, 2.8, MT.fabric2, cx + .8, 0, cz + 2.5);
      c(.9, 1.2, MT.woodDark, cx + .8, 0, cz, 16);
      break;
    case 'theatre':
      b(w - 1, .06, d - 1, MT.rugDark, cx, 0, cz); b(w - 5, 3.2, .25, MT.dark, cx, .5, r.z0 + .9);
      for (let row = 0; row < 2; row++) for (let i = -1; i <= 1; i++) {
        b(3.2, 1.7, 3.2, MT.fabricDark, cx + i * 3.8, row * .5, cz + 1 + row * 4.4); b(3.2, 2.8, .6, MT.fabricDark, cx + i * 3.8, row * .5, cz + 2.9 + row * 4.4);
      }
      b(w - 1, .5, 4.4, MT.woodDark, cx, 0, cz + 5.4);
      break;
    case 'dress':
      b(1.8, 4, d - 1.4, MT.wood, r.x0 + 1.2, 0, cz); b(w - 3.4, 4, 1.8, MT.wood, cx + .8, 0, r.z0 + 1.2); b(2.4, 2.4, 2.4, MT.woodDark, cx + .6, 0, cz + .8);
      break;
    case 'linen':
      b(w - 1.2, 4, 1.6, MT.wood, cx, 0, r.z0 + 1.1); b(1.6, 4, d - 4, MT.wood, r.x1 - 1.1, 0, cz + 1);
      break;
    case 'foyer':
      b(6, .06, 6, MT.rug, cx, 0, cz + 2); b(4.4, 2.6, 1.2, MT.woodDark, cx, 0, r.z0 + 1); b(1.6, .9, .6, MT.gold, cx, 2.6, r.z0 + 1);
      plant(r.x0 + 1.8, r.z1 - 2, 1); plant(r.x1 - 1.8, r.z1 - 2, 1);
      break;
    case 'terrace':
      for (let i = 0; i < 7; i++) b(4, 1.4, 1.4, MT.leaf, r.x0 + 3 + i * 6, 0, r.z1 - 1.1);
      b(8, 1.3, 2.8, MT.fabric, cx - 8, 0, cz - 1); b(3.2, 1, 3.2, MT.wood, cx - 8, 0, cz + 2.2); c(3.6, 2.4, MT.wood, cx + 8, 0, cz, 24);
      [[-3, 0], [3, 0], [0, -3], [0, 3]].forEach((p) => b(1.4, 1.5, 1.4, MT.fabric2, cx + 8 + p[0] * 1.3, 0, cz + p[1] * 1.3));
      for (let x = r.x0 + 18; x < r.x0 + 34; x += 1.2) b(.25, .3, 8, MT.woodDark, x, 6.2, cz); // pergola
      break;
    case 'balcony':
      b(2.2, 1.6, 2.2, MT.fabric2, cx - 3, 0, cz); b(2.2, 1.6, 2.2, MT.fabric2, cx + 1, 0, cz); c(.8, 1.3, MT.wood, cx - 1, 0, cz, 14); plant(r.x1 - 1.6, cz, .9);
      break;
    default: break;
  }
}
