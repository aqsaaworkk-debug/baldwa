import * as THREE from 'three';

// Procedural 3D model of the client's "Wardrobe - 1" (drawings in public/images/projects/stages/), for the interactive
// viewer on its featured-project card. Metres; y up; the inside corner of the L sits at the origin, the back wall runs
// along +x and the side wall along +z.
//
// From the drawings: 3809 mm run along the back wall (seven 455 mm doors, plus a 587 mm blind corner that is reached
// from the other wing), 2616 mm high: 100 mm skirting, 1043 mm fluted lower shutters, a 50 mm reveal, then the arched
// PU-finish upper shutters with brushed metal handles. The second wing (five doors) follows the client's isometric.
// The depth is not dimensioned on the drawings; 600 mm is assumed.

const MM = 0.001;
const D = 600 * MM;          // carcass depth (assumed)
const H = 2616 * MM;         // overall height
const T = 18 * MM;           // board thickness
const DOOR = 455 * MM;       // door width
const GAP = 3 * MM;          // gap between shutters
const SKIRT = 100 * MM;
const LOW_TOP = SKIRT + 1043 * MM;   // top of the fluted lower shutters
const UP_BOT = LOW_TOP + 50 * MM;    // bottom of the arched upper shutters
const RUN_B = 3809 * MM;             // back-wall run
const DOORS_B = 7, DOORS_L = 5;

export type WardrobeModel = { root: THREE.Group; size: THREE.Vector3; center: THREE.Vector3; dispose: () => void };

export function buildWardrobe(): WardrobeModel {
  const root = new THREE.Group();
  const geos: THREE.BufferGeometry[] = [];
  const g = <G extends THREE.BufferGeometry>(x: G) => (geos.push(x), x);

  const cream = new THREE.MeshStandardMaterial({ color: '#ece4d6', roughness: 0.62, metalness: 0 });
  const shutter = new THREE.MeshStandardMaterial({ color: '#f1eadd', roughness: 0.45, metalness: 0 }); // PU finish
  const groove = new THREE.MeshStandardMaterial({ color: '#d8cdbb', roughness: 0.55 });
  const reveal = new THREE.MeshStandardMaterial({ color: '#c9bfae', roughness: 0.8 });
  const skirt = new THREE.MeshStandardMaterial({ color: '#ddd4c5', roughness: 0.7 });
  const brass = new THREE.MeshStandardMaterial({ color: '#c6a46a', roughness: 0.32, metalness: 1 });
  const mats = [cream, shutter, groove, reveal, skirt, brass];

  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(g(new THREE.BoxGeometry(w, h, d)), m);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };

  // ---------- carcasses (local frame of each wing: doors face +z, the run goes along +x) ----------
  const wingB = new THREE.Group(); // back wall, doors face +z
  const wingL = new THREE.Group(); // side wall, doors face +x
  const lenL = DOORS_L * DOOR + 2 * T;
  // turned a quarter: its doors (local +z) face world +x and its run (local +x) goes toward the corner (world -z),
  // so it starts at its far end and finishes against the back run's blind corner at z = D
  wingL.rotation.y = Math.PI / 2;
  wingL.position.set(0, 0, D + lenL);
  root.add(wingB, wingL);

  const carcass = (wing: THREE.Group, len: number) => {
    const add = (m: THREE.Mesh) => { root.remove(m); wing.add(m); };
    add(box(len, T, D, cream, len / 2, H - T / 2, D / 2));                       // top
    add(box(len, H - SKIRT, T, cream, len / 2, SKIRT + (H - SKIRT) / 2, T / 2));  // back
    add(box(len - 0.06, SKIRT - 0.004, D - 0.05, skirt, len / 2, SKIRT / 2, (D - 0.05) / 2)); // recessed skirting
    add(box(len, T, D - 0.02, cream, len / 2, SKIRT + T / 2, (D - 0.02) / 2));  // bottom board
  };
  carcass(wingB, RUN_B);
  carcass(wingL, lenL);
  // end panels: far end of each wing, full height and depth
  { const m = box(T, H, D, cream, RUN_B - T / 2, H / 2, D / 2); root.remove(m); wingB.add(m); }
  { const m = box(T, H, D, cream, T / 2, H / 2, D / 2); root.remove(m); wingL.add(m); } // its far end (local x = 0)
  // blind corner of the back run, closed by a plain panel flush with the side wing's doors
  { const m = box(D, H - SKIRT, T, cream, D / 2, SKIRT + (H - SKIRT) / 2, D - T / 2); root.remove(m); wingB.add(m); }

  // ---------- shutters ----------
  const upH = H - T - UP_BOT - GAP, lowH = LOW_TOP - SKIRT - GAP;
  const w = DOOR - GAP;
  // the arched moulding on each upper shutter: a slim raised ring (outer arch minus an inner one), slightly darker so it
  // reads as the drawn groove line (one shared geometry)
  const archGeo = (() => {
    const arch = (r: number, bottom: number, top: number, path: THREE.Path) => {
      path.moveTo(-r, bottom); path.lineTo(r, bottom); path.lineTo(r, top - r);
      path.absarc(0, top - r, r, 0, Math.PI, false); path.lineTo(-r, bottom);
      return path;
    };
    const r = (w - 0.11) / 2, bottom = 0.07, top = upH - 0.075, b = 0.008;
    const s = arch(r, bottom, top, new THREE.Shape()) as THREE.Shape;
    s.holes.push(arch(r - b, bottom + b, top - b, new THREE.Path()));
    return g(new THREE.ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.0015, bevelSegments: 2, curveSegments: 40 }));
  })();
  const doorGeoUp = g(new THREE.BoxGeometry(w, upH, T));
  const doorGeoLow = g(new THREE.BoxGeometry(w, lowH, T));
  const handleGeo = g(new THREE.CylinderGeometry(0.0065, 0.0065, 0.17, 16));
  const knobGeo = g(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 20));
  knobGeo.rotateX(Math.PI / 2);
  // flutes: half-round reeds across each lower shutter, instanced per wing
  const FLUTE = 0.0225, R = 0.0085;
  const fluteGeo = g(new THREE.CylinderGeometry(R, R, lowH - 0.01, 10, 1, true, -Math.PI / 2, Math.PI));
  const perDoor = Math.floor((w - 0.01) / FLUTE);

  const shutters = (wing: THREE.Group, x0: number, n: number) => {
    const flutes = new THREE.InstancedMesh(fluteGeo, shutter, n * perDoor);
    flutes.castShadow = true; flutes.receiveShadow = true;
    const m4 = new THREE.Matrix4();
    let k = 0;
    for (let i = 0; i < n; i++) {
      const cx = x0 + i * DOOR + DOOR / 2, z = D + T / 2;
      const up = new THREE.Mesh(doorGeoUp, shutter); up.position.set(cx, UP_BOT + upH / 2, z);
      const low = new THREE.Mesh(doorGeoLow, shutter); low.position.set(cx, SKIRT + GAP + lowH / 2, z);
      const arch = new THREE.Mesh(archGeo, groove); arch.position.set(cx, UP_BOT, D + T);
      for (const m of [up, low, arch]) { m.castShadow = true; m.receiveShadow = true; wing.add(m); }
      // reeds
      const span = perDoor * FLUTE, start = cx - span / 2 + FLUTE / 2;
      for (let f = 0; f < perDoor; f++) { m4.makeTranslation(start + f * FLUTE, SKIRT + GAP + lowH / 2, D + T); flutes.setMatrixAt(k++, m4); }
      // brushed metal handles on the opening edge of each upper shutter (doors open in pairs), and the small push
      // latch on the lower shutters of every other door, as drawn
      const edge = i % 2 === 0 ? 1 : -1;
      const hx = cx + edge * (w / 2 - 0.035);
      for (const hy of [UP_BOT + 0.17, H - T - 0.62]) {
        const h = new THREE.Mesh(handleGeo, brass); h.position.set(hx, hy, D + T + 0.022); h.castShadow = true; wing.add(h);
        for (const dy of [-0.07, 0.07]) { const s = new THREE.Mesh(g(new THREE.CylinderGeometry(0.004, 0.004, 0.022, 10)), brass); s.rotation.x = Math.PI / 2; s.position.set(hx, hy + dy, D + T + 0.011); wing.add(s); }
      }
      if (i % 2 === 0) { const kn = new THREE.Mesh(knobGeo, brass); kn.position.set(cx + w / 2 - 0.02, LOW_TOP - 0.04, D + T + 0.003); wing.add(kn); }
    }
    flutes.instanceMatrix.needsUpdate = true;
    wing.add(flutes);
    // the 50 mm reveal between lower and upper shutters
    const r = new THREE.Mesh(g(new THREE.BoxGeometry(n * DOOR, UP_BOT - LOW_TOP, 0.006)), reveal);
    r.position.set(x0 + (n * DOOR) / 2, (LOW_TOP + UP_BOT) / 2, D + 0.003); wing.add(r);
  };
  shutters(wingB, D, DOORS_B);
  shutters(wingL, T, DOORS_L);

  root.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  const bounds = new THREE.Box3().setFromObject(root);
  return {
    root,
    size: bounds.getSize(new THREE.Vector3()),
    center: bounds.getCenter(new THREE.Vector3()),
    dispose: () => { geos.forEach((x) => x.dispose()); mats.forEach((m) => m.dispose()); },
  };
}
