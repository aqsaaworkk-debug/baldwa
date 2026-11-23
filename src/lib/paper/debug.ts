// Debug panel for the paper story (lil-gui). Toggle with D: always on localhost, elsewhere only with ?debug in the URL.
// Drag the paper onto the table, then "Copy values" and paste the JSON into config.ts.
import GUI from 'lil-gui';
import type { PaperConfig } from './config';

let gui: GUI | null = null;

export function toggleDebug(cfg: PaperConfig, hooks: { change: () => void; rebuild: () => void; scrub: (p: number) => void; progress: () => number }) {
  if (gui) { gui.destroy(); gui = null; return; }
  gui = new GUI({ title: 'Paper story  (D to hide)', width: 300 });
  const c = hooks.change;

  const view = { progress: hooks.progress() };
  gui.add(view, 'progress', 0, 1, .001).name('scroll to').onChange((v: number) => hooks.scrub(v));

  const s = gui.addFolder('Start pose (on the table)');
  s.add(cfg.start, 'u', 0, 1, .001).name('x on image').onChange(c);
  s.add(cfg.start, 'v', 0, 1, .001).name('y on image').onChange(c);
  s.add(cfg.start, 'z', -6, 6, .01).name('depth').onChange(c);
  s.add(cfg.start, 'rotX', -Math.PI, Math.PI, .005).name('tilt (x)').onChange(c);
  s.add(cfg.start, 'rotY', -Math.PI, Math.PI, .005).name('turn (y)').onChange(c);
  s.add(cfg.start, 'rotZ', -Math.PI, Math.PI, .005).name('spin (z)').onChange(c);
  s.add(cfg.start, 'scale', .05, 1, .001).name('scale').onChange(c);

  const sh = gui.addFolder('Shadow');
  sh.add(cfg.shadow, 'opacity', 0, 1, .01).onChange(c);
  sh.add(cfg.shadow, 'offsetX', -.3, .3, .001).name('offset x (rest)').onChange(c);
  sh.add(cfg.shadow, 'offsetY', -.3, .3, .001).name('offset y (rest)').onChange(c);
  sh.add(cfg.shadow, 'driftX', -1, 1, .005).name('drift x (lifted)').onChange(c);
  sh.add(cfg.shadow, 'driftY', -1, 1, .005).name('drift y (lifted)').onChange(c);
  sh.add(cfg.shadow, 'grow', 0, 3, .01).onChange(c);
  sh.add(cfg.shadow, 'fade', 0, 1, .01).onChange(c);
  sh.add(cfg.shadow, 'contactSpread', 1.02, 1.4, .01).name('contact softness').onChange(hooks.rebuild);
  sh.add(cfg.shadow, 'softSpread', 1.1, 2.2, .01).name('lifted softness').onChange(hooks.rebuild);

  const r = gui.addFolder('Roll');
  r.add(cfg.roll, 'radius', .005, .15, .001).onChange(c);
  r.add(cfg.roll, 'gap', 0, .03, .0005).name('gap per turn').onChange(c);
  r.add(cfg.roll, 'taper', 0, .4, .005).onChange(c);
  r.add(cfg.roll, 'shade', 0, 1, .01).name('curl shading').onChange(c);
  r.add(cfg.roll, 'tilt', -1, .5, .01).name('lean back while rolling').onChange(c);
  r.add(cfg.roll, 'yaw', -.8, .8, .01).name('turn while rolling').onChange(c);
  const d = gui.addFolder('Shadow under the floating sheet');
  d.add(cfg.drop, 'opacity', 0, 1, .01).onChange(c);
  d.add(cfg.drop, 'offsetX', -.2, .2, .001).onChange(c);
  d.add(cfg.drop, 'offsetY', -.2, .2, .001).onChange(c);
  d.add(cfg.drop, 'depth', 0, .5, .005).onChange(c);
  d.add(cfg.drop, 'spread', 1.05, 2, .01).name('softness').onChange(hooks.rebuild);
  gui.add(cfg, 'bend', 0, .3, .005).name('lift bend').onChange(c);

  const l = gui.addFolder('Lamp').close();
  l.addColor(cfg.light, 'tint').onChange(c);
  l.add(cfg.light, 'highlight', 0, .5, .005).onChange(c);
  l.add(cfg.light, 'ambient', 0, 2, .01).onChange(c);
  l.add(cfg.light, 'lamp', 0, 2, .01).onChange(c);

  gui.add({
    copy() {
      const out = JSON.stringify({ start: cfg.start, shadow: cfg.shadow, roll: cfg.roll, light: cfg.light }, null, 2);
      console.log('[paper] config values:\n' + out);
      navigator.clipboard?.writeText(out).catch(() => { });
    },
  }, 'copy').name('Copy values (also logged)');
}
