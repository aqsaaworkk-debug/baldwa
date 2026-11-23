// Scroll timeline of the paper story: one pure function from progress p (0..1) to the state of everything on screen.
// No accumulated state, so scrolling back restores exactly the same picture. Stage lengths (screens) live in config.ts.
//
// p covers the pinned stages (config.stages) plus the "away" screen after them: the hero is released and scrolls away
// naturally with the paper rolling up on it, until Projects (right behind it) reaches the top of the screen.
import type { PaperConfig } from './config';

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const range = (x: number, a: number, b: number) => clamp01((x - a) / (b - a || 1));
export const smooth = (t: number) => t * t * (3 - 2 * t);
const easeInOut = (t: number) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const ORDER = ['fadeIn', 'lift', 'settle', 'write', 'pause'] as const;
type Stage = (typeof ORDER)[number] | 'away';

// Pinned length (the hero stays put), the natural scroll-away after it, and the total, in screens.
export const pinnedScreens = (cfg: PaperConfig) => ORDER.reduce((n, k) => n + cfg.stages[k], 0);
export const awayScreens = (_cfg: PaperConfig) => 1; // the stage is one screen tall: Projects starts right under it
export const totalScreens = (cfg: PaperConfig) => pinnedScreens(cfg) + awayScreens(cfg);

// Start and end of each stage in p.
export function stageBounds(cfg: PaperConfig) {
  const total = totalScreens(cfg);
  let at = 0;
  const out = {} as Record<Stage, [number, number]>;
  for (const k of ORDER) { out[k] = [at / total, (at + cfg.stages[k]) / total]; at += cfg.stages[k]; }
  out.away = [at / total, 1];
  return out;
}

export type PaperState = {
  fade: number;      // stage opacity (crossfade from the film's last frame)
  lift: number;      // 0 on the table → 1 centred, facing the camera (eased)
  arc: number;       // swing towards the camera across the lift (0 → 1 → 0)
  bend: number;      // bend envelope: comes in early in the lift, eases out as it settles
  write: number[];   // text reveal per line, 0..1: [0] the heading, then the points
  sticker: { scale: number; rotate: number }; // the sticker at the end of the paper (on it from the start)
  roll: number;      // 0 flat → 1 fully rolled into a tube (drives the shader's uRoll); happens while the hero scrolls away
  backdrop: number;  // 0 sharp hero photo → 1 blurred and dimmed
  shadow: number;    // 0 contact shadow on the table → 1 wide, soft, far and faint
  heroShift: number; // how far the hero photo has slid up inside the pinned stage, in screens (0 → heroShift)
  projectsIn: number; // Projects panels sliding in from the right, 0 → 1
  headingIn: number;  // Projects heading sliding in from the right, 0 → 1
};

export function paperState(p: number, cfg: PaperConfig): PaperState {
  const b = stageBounds(cfg);
  const liftT = range(p, ...b.lift);
  const [w0, w1] = b.write;
  const n = cfg.points.length + 1, chunk = (w1 - w0) / n; // the heading is written first
  const write: number[] = [];
  for (let i = 0; i < n; i++) write.push(range(range(p, w0 + i * chunk, w0 + (i + 1) * chunk), 0, cfg.writeSplit));
  const lift = easeInOut(liftT);
  // once the hero is released: the paper rolls up as it scrolls away, and Projects' projects slide in from the right
  const [a0, a1] = b.away;
  const roll = easeInOut(range(p, a0, a0 + (a1 - a0) * cfg.rollEnd));
  return {
    fade: smooth(range(p, ...b.fadeIn)),
    lift,
    arc: Math.sin(Math.PI * liftT),
    bend: Math.sin(Math.PI * Math.pow(liftT, .6)), // peaks about a third of the way up, then eases out
    write,
    sticker: { scale: 1, rotate: cfg.sticker.rotate },
    roll,
    backdrop: lift * (1 - smooth(range(p, a0, a1))),
    shadow: smooth(liftT),
    heroShift: cfg.heroShift * lift,
    projectsIn: easeInOut(range(p, a0 + (a1 - a0) * cfg.projectsSlide.panels[0], a0 + (a1 - a0) * cfg.projectsSlide.panels[1])),
    headingIn: easeInOut(range(p, a0 + (a1 - a0) * cfg.projectsSlide.heading[0], a0 + (a1 - a0) * cfg.projectsSlide.heading[1])),
  };
}
