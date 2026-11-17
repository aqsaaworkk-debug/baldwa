// Master timeline for the scroll journey.
//
// One number drives everything: journey.p (0 → 1 across the whole section). Journey.tsx writes
// it from a scrubbed ScrollTrigger; the 3D world (world.ts), the camera and the HTML overlays
// only ever read it. Every state is a pure function of p, so scrolling back restores it exactly.
//
// Stages are declared with a length in screens of scroll. Their positions on the 0 → 1 line
// are derived, so appending a stage never means renumbering the ones before it. Camera keys
// and overlay cues are written in stage-local time with at('stage', t).

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => { const x = clamp(t); return x * x * (3 - 2 * x); };
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));

export const journey = {
  p: 0,
  // written by founder.ts, read by nothing in the app: lets a test compare the clip's time with its target
  founder: { target: 0, time: 0, ready: false },
};

// ---- World layout (metres). Origin = centre of the plot; +z runs towards the road and the opening camera. ----
export const PLOT = { w: 60, d: 46, z0: -26, z1: 20 };   // the hotel's site
export const ROAD = { z: 31, w: 8 };                     // main road in front of the plot
export const CLOUDS = { y0: 520, y1: 980 };              // cloud deck, bottom and top
export const CLEARING = { x: 0, z: 700, r: 1900 };       // where the clouds open

// ---- Stages ----
// Built so far: the opening. Still to come, in order (see PLANNED): each will add an entry to
// BUILT, camera keys to CAMERA and an actor in world.ts.
const BUILT = [
  { id: 'logo', screens: .7 },    // opening screen above the clouds: the scroll cue fades out (the logo is already in the header, see Intro.tsx)
  { id: 'clouds', screens: .9 },  // drifting over the dense cloud deck
  { id: 'reveal', screens: 1.3 }, // clouds part, the land appears
  { id: 'site', screens: 1.7 },   // descent to the wide view of the neighbourhood and the plot
  { id: 'founder', screens: 2.4 },// down to the roadside, behind the founder as he walks towards the site
] as const;

export const PLANNED = ['blueprint', 'construction', 'completion', 'arrival', 'interior', 'model'] as const;

export type StageId = (typeof BUILT)[number]['id'];

// Screens of scroll the journey takes; the section is one screen taller (journey.css).
export const SCREENS = BUILT.reduce((n, s) => n + s.screens, 0);

const SPAN = {} as Record<StageId, { from: number; to: number }>;
{
  let acc = 0;
  for (const s of BUILT) { SPAN[s.id] = { from: acc / SCREENS, to: (acc + s.screens) / SCREENS }; acc += s.screens; }
}

// Master progress for a moment inside a stage (t = 0 start, 1 end).
export const at = (id: StageId, t = 0) => lerp(SPAN[id].from, SPAN[id].to, t);
// Local 0 → 1 progress of a stage for a master progress value.
export const stageT = (id: StageId, p: number) => range(p, SPAN[id].from, SPAN[id].to);

// ---- Founder (green-screen clip on a plane, see founder.ts) ----
export const FOUNDER = {
  x: 0, z0: 47.5,                   // where he starts: on the verge, on the camera's side of the road
  speed: 1,                         // metres he covers per second of clip (he walks in place in the clip)
  clip: [.05, 9.75],                // seconds of the clip spread across the founder stage; it is not a loop and is never wrapped
  frameTop: 1.92, frameBottom: .5,  // real heights of the clip's top and bottom edges, in metres
  appear: [.14, .3],                // stage-local: he fades in while the camera comes down
  hide: [2, 3],                     // master progress: he fades out as the camera passes the entrance. That stage is not built yet, so this never triggers.
  follow: [.26, .54],               // stage-local: camera blends from its descent to the shot behind him
  shot: { back: 1.55, height: 1.55, lookHeight: 1.74, fov: 52, fovNarrow: 60 }, // head-to-torso rear framing
  key: { low: .08, high: .19, feather: 1.5, spill: 1 },       // green selection, edge softness (video pixels), spill removal
  grade: { gain: [1.1, 1.04, .96] as [number, number, number], saturation: .95 }, // warms the studio light towards the scene's daylight
};

// Where the founder is and which moment of the clip shows, for a master progress value.
export function founderAt(p: number) {
  const time = lerp(FOUNDER.clip[0], FOUNDER.clip[1], stageT('founder', p));
  return { x: FOUNDER.x, z: FOUNDER.z0 - FOUNDER.speed * (time - FOUNDER.clip[0]), time };
}

// ---- Chapters (HTML captions and navigation) ----
export const CHAPTERS = [
  { id: 'sky', label: 'Sky', kicker: '01 / The beginning', title: 'A world of possibility.', detail: 'Above the clouds, the journey begins.', show: [at('clouds', .55), at('reveal', .55)], goto: at('clouds', 1) },
  { id: 'site', label: 'Site', kicker: '02 / The site', title: 'A place to begin.', detail: 'The land. The setting. The first possibility.', show: [at('site', .8), at('founder', .1)], goto: at('site', 1) },
] as const;

// ---- Camera ----
type V3 = [number, number, number];
type Key = { at: number; pos: V3; look: V3; fov: number };

export const CAMERA: Key[] = [
  { at: 0,               pos: [0, 1500, 2600], look: [0, 0, -2200], fov: 42 }, // above the deck, a sliver of sky
  { at: at('clouds', 1), pos: [0, 1400, 2150], look: [0, 0, -1900], fov: 42 },
  { at: at('reveal', 1), pos: [0, 1040, 1500], look: [0, 0, -300],  fov: 44 }, // the plain, seen through the clearing
  { at: at('site', .55), pos: [0, 170, 360],   look: [0, 4, -50],   fov: 50 },
  { at: at('site', .92), pos: [0, 24, 84],     look: [0, 8, -60],   fov: 54 }, // wide site view from above the road
  { at: at('site', 1),   pos: [0, 24, 84],     look: [0, 8, -60],   fov: 54 },
  // down behind the founder; from FOUNDER.follow onwards the camera is tied to him (see sampleCamera)
  { at: at('founder', .3), pos: [0, 3.4, 58],  look: [0, 1.6, 10],  fov: 50 },
  { at: 1,               pos: [0, 1.6, 40],    look: [0, 1.7, -10], fov: 52 },
];

// Monotone cubic interpolation (Fritsch–Carlson): smooth through the keys, never overshoots,
// so the camera cannot dip under the ground between two keys.
function monotone(xs: number[], ys: number[]) {
  const n = xs.length, d: number[] = [], m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

const times = CAMERA.map((k) => k.at);
const track = (pick: (k: Key) => number) => monotone(times, CAMERA.map(pick));
const TRACKS = {
  pos: [0, 1, 2].map((i) => track((k) => k.pos[i])),
  look: [0, 1, 2].map((i) => track((k) => k.look[i])),
  fov: track((k) => k.fov),
};

export type Shot = { pos: V3; look: V3; fov: number };

// Camera for a progress value and a screen shape. Narrow screens get a wider lens and a small
// step back, so the same width of site stays in frame.
export function sampleCamera(p: number, aspect: number, out: Shot): Shot {
  for (let i = 0; i < 3; i++) { out.pos[i] = TRACKS.pos[i](p); out.look[i] = TRACKS.look[i](p); }
  const fov = TRACKS.fov(p);
  out.fov = aspect < 1.25 ? Math.min(76, fov * Math.pow(1.25 / aspect, .85)) : fov;
  if (aspect < 1) {
    const k = 1 + (1 - aspect) * .45;
    for (let i = 0; i < 3; i++) out.pos[i] = out.look[i] + (out.pos[i] - out.look[i]) * k;
  }
  // Behind the founder: the camera keeps a fixed offset from him, so it stays behind him and
  // frames him from head to torso however he moves. This shot is not widened on narrow screens:
  // the clip ends above his knees, so the frame must end above them too.
  const follow = smooth(range(stageT('founder', p), FOUNDER.follow[0], FOUNDER.follow[1]));
  if (follow > 0) {
    const who = founderAt(p), s = FOUNDER.shot;
    const pos: V3 = [who.x, s.height, who.z + s.back], look: V3 = [who.x, s.lookHeight, who.z - 40];
    for (let i = 0; i < 3; i++) { out.pos[i] = lerp(out.pos[i], pos[i], follow); out.look[i] = lerp(out.look[i], look[i], follow); }
    out.fov = lerp(out.fov, aspect < 1 ? s.fovNarrow : s.fov, follow);
  }
  return out;
}

// ---- Rendering quality ----
export type Quality = {
  tier: 'low' | 'high';
  dpr: [number, number];  // pixel-ratio range; PerformanceMonitor moves inside it
  cloudSteps: number;     // ray-march samples per pixel
  noise: number;          // 3D noise texture size
  shadow: number;         // shadow-map size, 0 = off
  detail: number;         // 0 → 1 share of trees and houses to build
};

export function pickQuality(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const small = window.matchMedia('(max-width: 820px)').matches;
  const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 || !!nav.connection?.saveData;
  return small || weak
    ? { tier: 'low', dpr: [.75, 1.25], cloudSteps: 28, noise: 40, shadow: 1024, detail: .55 }
    : { tier: 'high', dpr: [1, 1.75], cloudSteps: 48, noise: 64, shadow: 2048, detail: 1 };
}
