// Paper story scene (plain three.js, rendered on demand): a transparent full-screen canvas over the hero photo and the
// Projects section (the photo itself is CSS, so it covers the screen like object-fit: cover, and scrolls up by
// state.heroShift). Holds the camera, the paper, its table shadows and the lamp light, and turns the scroll progress into
// their state through paperState() (timeline.ts). Tweak values in config.ts.
import * as THREE from 'three';
import type { PaperConfig } from '@/lib/paper/config';
import { paperState, range, smooth, stageBounds } from '@/lib/paper/timeline';
import { createPaperWriter, type PaperArt } from '@/lib/paper/texture';
import { createPaperMaterial, createShadowTexture } from './paperRoll';

const CAM_Z = 10;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number };

export function createPaperScene(canvas: HTMLCanvasElement, cfg: PaperConfig, art: PaperArt, opts: { mobile: boolean }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !opts.mobile, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const FOV = cfg.fov; // matched to the film's desk shot (config.ts)
  const camera = new THREE.PerspectiveCamera(FOV, 1, .1, 60);
  camera.position.set(0, 0, CAM_Z);

  const [pw, ph] = cfg.assets.paperSize;
  const aspect = pw / ph;

  // Paper: its face is the writer's canvas (photo + handwriting + sticker). More segments along y, the roll axis.
  const writer = createPaperWriter(cfg, art, opts.mobile ? 960 : 1400); // canvas width in px (landscape sheet)
  const map = new THREE.CanvasTexture(writer.canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const { material, uniforms } = createPaperMaterial(map);
  const geometry = new THREE.PlaneGeometry(aspect, 1, 80, 120);
  const paper = new THREE.Mesh(geometry, material);
  scene.add(paper);

  // Shadows on the table, in the paper's starting plane, drawn before the paper (no depth write, no z-fighting):
  // a tight contact shadow while it lies flat, and a wide soft one that takes over as it rises.
  const makeShadow = (spread: number) => {
    const mat = new THREE.MeshBasicMaterial({ map: createShadowTexture(aspect, spread), transparent: true, depthWrite: false, depthTest: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(aspect * spread, spread), mat);
    mesh.renderOrder = -1;
    scene.add(mesh);
    return { mesh, mat };
  };
  let contact = makeShadow(cfg.shadow.contactSpread), soft = makeShadow(cfg.shadow.softSpread);

  // Drop shadow of the floating sheet on the page behind it: a soft blob just behind the sheet (a child of it, so it turns and
  // leans with it), sized each frame to the part of the sheet that is still flat plus the tube.
  const makeDrop = () => {
    const mat = new THREE.MeshBasicMaterial({ map: createShadowTexture(aspect, cfg.drop.spread), transparent: true, depthWrite: false, depthTest: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(aspect * cfg.drop.spread, cfg.drop.spread), mat);
    mesh.renderOrder = -2;
    paper.add(mesh);
    return { mesh, mat };
  };
  let drop = makeDrop();

  // The lamp is top right: soft warm fill plus a directional key from up there (physical units: × π, as in scenes.ts).
  const ambient = new THREE.AmbientLight('#fff6ec', cfg.light.ambient * Math.PI);
  const lamp = new THREE.DirectionalLight(cfg.light.lampColor, cfg.light.lamp * Math.PI);
  lamp.position.set(5, 6, 7);
  scene.add(ambient, lamp);

  let vw = 1, vh = 1, progress = 0, heroShift = 0;
  const visH = (z: number) => 2 * (CAM_Z - z) * Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  // Start pose: the config gives a point on the background image; work out where that image point is on screen
  // (same maths as object-fit: cover, minus how far the hero photo has scrolled up), then place the paper there at its
  // depth. Its size follows the image's size, so it stays on the same spot of the table.
  function startPose(): Pose {
    const [iw, ih] = cfg.assets.frameSize;
    const k = Math.max(vw / iw, vh / ih), dw = iw * k, dh = ih * k;
    const sx = (vw - dw) / 2 + cfg.start.u * dw, sy = (vh - dh) / 2 + cfg.start.v * dh - heroShift * vh;
    // No clamping on narrow screens: the sheet must sit exactly where the film's own sheet lies (even if partly off screen).
    const z = cfg.start.z, H = visH(z);
    return {
      x: (sx / vw - .5) * H * camera.aspect, y: (.5 - sy / vh) * H, z,
      rx: cfg.start.rotX, ry: cfg.start.rotY, rz: cfg.start.rotZ, s: cfg.start.scale * (dh / vh) * H,
    };
  }
  // Screen position (px) of the sheet's four corners in its start pose, as fractions of the background image (0..1).
  // Used to fit the start pose to the film's sheet (dev only, through window.__paper).
  function startCornersOnImage() {
    const a = startPose();
    const o = new THREE.Object3D();
    o.position.set(a.x, a.y, a.z); o.rotation.set(a.rx, a.ry, a.rz); o.scale.setScalar(a.s); o.updateMatrixWorld();
    const [iw, ih] = cfg.assets.frameSize;
    const k = Math.max(vw / iw, vh / ih), dw = iw * k, dh = ih * k;
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
      const v = new THREE.Vector3(sx * aspect / 2, sy / 2, 0).applyMatrix4(o.matrixWorld).project(camera);
      const px = (v.x + 1) / 2 * vw, py = (1 - v.y) / 2 * vh;
      return [(px - (vw - dw) / 2) / dw, (py - (vh - dh) / 2) / dh];
    });
  }
  // Centred pose: facing the camera, center.height of the screen tall, never wider than 92% of the screen.
  function centerPose(): Pose {
    const H = visH(0);
    return { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: Math.min(cfg.center.height * H, .92 * H * camera.aspect / aspect) };
  }

  function apply() {
    const st = paperState(progress, cfg);
    heroShift = st.heroShift;
    const a = startPose(), b = centerPose(), t = st.lift;

    // Lift from the table to the centre, swinging slightly towards the camera on the way. It rolls up while the hero scrolls
    // away: the canvas lives in the hero's stage, so the sheet scrolls away with the hero photo.
    paper.position.set(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t) + st.arc * cfg.center.arc);
    // while rolling, the sheet leans back and turns a little, so the tube is seen in perspective (a roll, not a band)
    const rollIn = Math.sin(Math.PI / 2 * st.roll);
    paper.rotation.set(lerp(a.rx, b.rx, t) + cfg.roll.tilt * rollIn, lerp(a.ry, b.ry, t) + cfg.roll.yaw * rollIn, lerp(a.rz, b.rz, t));
    paper.scale.setScalar(lerp(a.s, b.s, t));

    uniforms.uBend.value = cfg.bend * st.bend;
    uniforms.uRoll.value = st.roll;
    uniforms.uRadius.value = cfg.roll.radius;
    uniforms.uGap.value = cfg.roll.gap;
    uniforms.uTaper.value = cfg.roll.taper;
    uniforms.uShade.value = cfg.roll.shade;
    uniforms.uTint.value.set(cfg.light.tint);
    uniforms.uHighlight.value = cfg.light.highlight;
    ambient.intensity = cfg.light.ambient * Math.PI;
    lamp.intensity = cfg.light.lamp * Math.PI;
    lamp.color.set(cfg.light.lampColor);

    if (writer.draw(st)) map.needsUpdate = true;

    // drop shadow: covers the sheet from the bottom of the tube (same maths as the shader) to the top edge
    const rollY = -.5 + st.roll * 1.002;
    const R = Math.sqrt(cfg.roll.radius ** 2 + 2 * (cfg.roll.gap / (2 * Math.PI)) * (rollY + .5));
    const bottom = st.roll > 0 ? rollY - R : -.5, top = .5;
    drop.mesh.position.set(cfg.drop.offsetX, (top + bottom) / 2 + cfg.drop.offsetY, -cfg.drop.depth);
    drop.mesh.scale.set(1, Math.max(.02, top - bottom), 1);
    drop.mat.opacity = cfg.drop.opacity * smooth(range(st.lift, .5, 1));
    drop.mesh.visible = drop.mat.opacity > .002;

    // Shadows stay on the table where the paper lay, falling to the bottom left (away from the lamp). As the paper rises the
    // tight contact shadow gives way to the wide soft one, which grows, drifts farther away and fades; both are gone by the
    // time the paper is written on.
    const sh = cfg.shadow, k = st.shadow;
    const place = (m: THREE.Mesh, scale: number, ox: number, oy: number) => {
      m.position.set(a.x, a.y, a.z);
      m.rotation.set(a.rx, a.ry, a.rz);
      m.scale.setScalar(a.s * scale);
      m.translateX(ox * a.s); m.translateY(oy * a.s); m.translateZ(-.002);
    };
    const gone = 1 - range(progress, stageBounds(cfg).settle[0], stageBounds(cfg).write[0] + .02);
    place(contact.mesh, 1 + .15 * k, sh.offsetX, sh.offsetY);
    contact.mat.opacity = sh.opacity * (1 - Math.min(1, k * 2.5));
    place(soft.mesh, 1 + sh.grow * k, sh.offsetX + sh.driftX * k, sh.offsetY + sh.driftY * k);
    soft.mat.opacity = sh.opacity * .75 * Math.min(1, k * 3) * (1 - sh.fade * k) * gone;
    contact.mesh.visible = contact.mat.opacity > .002;
    soft.mesh.visible = soft.mat.opacity > .002;
    paper.visible = progress < 1;

    renderer.render(scene, camera);
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    vw = Math.max(1, r.width); vh = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); // capped at 1.5 (2026-11-24, smoother scrolling; no visible loss)
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    apply();
  }

  return {
    setProgress(p: number) { progress = p; apply(); },
    resize,
    startCornersOnImage,
    // after a config change from the debug panel (rebuilds the shadows if their softness changed)
    refresh() {
      for (const o of [contact, soft, drop]) { o.mesh.removeFromParent(); o.mesh.geometry.dispose(); o.mat.map?.dispose(); o.mat.dispose(); }
      contact = makeShadow(cfg.shadow.contactSpread); soft = makeShadow(cfg.shadow.softSpread); drop = makeDrop();
      writer.reset();
      apply();
    },
    dispose() {
      geometry.dispose(); material.dispose(); map.dispose();
      for (const o of [contact, soft, drop]) { o.mesh.geometry.dispose(); o.mat.map?.dispose(); o.mat.dispose(); }
      renderer.dispose();
    },
  };
}

export type PaperScene = ReturnType<typeof createPaperScene>;
