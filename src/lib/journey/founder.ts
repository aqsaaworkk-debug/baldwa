// The founder: a green-screen clip of a man walking away from the camera, shown as a video
// texture on an upright plane and keyed in a shader.
//
// The clip is never played. Its time is set from the master progress, so scrolling forward
// walks him on, scrolling back walks him back, and stopping holds a frame. He walks in place
// in the clip, so the plane itself moves forward at walking pace (founderAt in stages.ts).
//
// What the clip gives us: 1920×1080, about 10 s, framed from the helmet to just above the knees.
// We use only the middle of the frame (CROP). Because his lower legs are not in the clip, two
// plain trouser-coloured stubs stand under the plane; they are only ever seen from a distance,
// since the close shot frames him from head to torso.
import * as THREE from 'three';
import { FOUNDER, at, founderAt, journey, range, smooth, stageT } from './stages';

const SRC = '/video/founder.mp4';
const FRAME = { w: 1920, h: 1080 };
const CROP = { u0: .29, u1: .71 }; // part of the frame's width that is shown

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const fragmentShader = /* glsl */ `
uniform sampler2D map;
uniform vec2 uCrop;      // u range of the frame shown on the plane
uniform vec2 uTexel;
uniform float uKeyLow;   // greenness below this is kept in full
uniform float uKeyHigh;  // greenness above this is removed in full
uniform float uFeather;  // edge softness, in video pixels
uniform float uSpill;    // 0 = leave green spill, 1 = remove it
uniform float uSat;
uniform vec3 uGain;
uniform float uOpacity;
varying vec2 vUv;

// How much greener than red or blue a pixel is. The backdrop measures 0.21 to 0.27,
// the helmet, shirt, skin, drawing and trousers all stay under 0.03.
float matte(vec2 uv){
  vec3 c = texture2D(map, uv).rgb;
  return 1.0 - smoothstep(uKeyLow, uKeyHigh, c.g - max(c.r, c.b));
}

void main(){
  vec2 uv = vec2(mix(uCrop.x, uCrop.y, vUv.x), vUv.y);
  vec3 c = texture2D(map, uv).rgb;

  // soft edge: average the matte around the pixel, then pull the edge in a little so no green rim survives
  vec2 o = uTexel * uFeather;
  float a = matte(uv) * 0.36
    + (matte(uv + vec2(o.x, 0.0)) + matte(uv - vec2(o.x, 0.0)) + matte(uv + vec2(0.0, o.y)) + matte(uv - vec2(0.0, o.y))) * 0.11
    + (matte(uv + o) + matte(uv - o) + matte(uv + vec2(o.x, -o.y)) + matte(uv + vec2(-o.x, o.y))) * 0.05;
  a = smoothstep(0.3, 0.92, a);
  // fade out at the bottom and sides of the plane, so its edges can never show as a line
  a *= smoothstep(0.0, 0.08, vUv.y) * smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x);
  if (a < 0.004) discard;

  // spill: green may not exceed the stronger of red and blue (whites and greys stay neutral)
  c.g = mix(c.g, min(c.g, max(c.r, c.b)), uSpill);

  // grade in linear light to sit in the scene's daylight
  c = pow(c, vec3(2.2));
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSat) * uGain;

  gl_FragColor = vec4(c, a * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// Soft round shadow that anchors him to the ground.
function blobTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,.55)'); grad.addColorStop(.55, 'rgba(0,0,0,.22)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export type Founder = ReturnType<typeof createFounder>;

export function createFounder(sun: THREE.Vector3) {
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.loop = false; video.preload = 'auto';
  video.setAttribute('playsinline', ''); video.setAttribute('muted', '');

  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.NoColorSpace; // decoded to linear in the shader
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const refresh = () => { texture.needsUpdate = true; };
  video.addEventListener('seeked', refresh);
  video.addEventListener('loadeddata', refresh);

  // Some phones only decode frames for a video that has been played once after a touch.
  const unlock = () => { if (video.src) video.play().then(() => video.pause()).catch(() => {}); };
  window.addEventListener('pointerdown', unlock, { once: true, passive: true });

  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      map: { value: texture },
      uCrop: { value: new THREE.Vector2(CROP.u0, CROP.u1) },
      uTexel: { value: new THREE.Vector2(1 / FRAME.w, 1 / FRAME.h) },
      uKeyLow: { value: FOUNDER.key.low }, uKeyHigh: { value: FOUNDER.key.high },
      uFeather: { value: FOUNDER.key.feather }, uSpill: { value: FOUNDER.key.spill },
      uSat: { value: FOUNDER.grade.saturation }, uGain: { value: new THREE.Vector3(...FOUNDER.grade.gain) },
      uOpacity: { value: 0 },
    },
  });

  // Plane sized so the man is life-size: the frame's height covers frameTop → frameBottom metres.
  const height = FOUNDER.frameTop - FOUNDER.frameBottom;
  const width = height * ((CROP.u1 - CROP.u0) * FRAME.w) / FRAME.h;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  plane.position.y = FOUNDER.frameBottom + height / 2;
  plane.renderOrder = 20; // after the clouds (10): he is always in front of the sky

  const cloth = new THREE.MeshStandardMaterial({ color: '#10141b', roughness: .95, transparent: true });
  const legs = new THREE.Group();
  for (const s of [-1, 1]) {
    const h = FOUNDER.frameBottom + .1; // overlaps the faded bottom of the clip
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.07, .052, h, 10).translate(0, h / 2, 0), cloth);
    leg.position.set(s * .078, 0, -.03);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(.062, 10, 8).scale(1, .62, 2.2).translate(0, .04, -.07), cloth);
    shoe.position.set(s * .078, 0, -.03);
    legs.add(leg, shoe);
  }

  const blob = blobTexture();
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .95).rotateX(-Math.PI / 2), shadowMaterial);
  // falls away from the sun
  shadow.position.set(-sun.x * .55, .03, -sun.z * .55);
  shadow.rotation.y = Math.atan2(-sun.x, -sun.z);

  const group = new THREE.Group();
  group.add(shadow, legs, plane);
  group.visible = false;

  let requested = false;

  return {
    group,
    // p = master progress. Loads the clip shortly before it is needed, then keeps its time,
    // his position and his visibility in step with p.
    update(p: number) {
      if (!requested && p > at('site', .25)) { requested = true; video.src = SRC; video.load(); }
      const state = founderAt(p);
      group.position.set(state.x, 0, state.z);

      const ready = video.readyState >= 2;
      // One seek at a time: asking again while the decoder is busy only queues work.
      if (requested && video.readyState >= 1 && !video.seeking && Math.abs(video.currentTime - state.time) > 1 / 50) video.currentTime = state.time;

      // He appears once the camera has come down behind him, and (later) goes when it passes the entrance.
      const opacity = smooth(range(stageT('founder', p), FOUNDER.appear[0], FOUNDER.appear[1])) * (1 - smooth(range(p, FOUNDER.hide[0], FOUNDER.hide[1])));
      group.visible = ready && opacity > .002;
      material.uniforms.uOpacity.value = opacity;
      cloth.opacity = opacity; shadowMaterial.opacity = opacity;

      journey.founder.target = state.time; journey.founder.time = video.currentTime; journey.founder.ready = ready;
    },
    dispose() {
      video.removeEventListener('seeked', refresh); video.removeEventListener('loadeddata', refresh);
      window.removeEventListener('pointerdown', unlock);
      video.pause(); video.removeAttribute('src'); video.load();
      texture.dispose(); blob.dispose();
    },
  };
}
