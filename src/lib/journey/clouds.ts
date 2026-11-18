// Volumetric clouds: a ray-marched slab of procedural density, drawn as one full-screen
// triangle over the scene. No textures are downloaded; the 3D noise is generated here.
//
// The deck starts dense. As `clear` goes 0 → 1 the coverage thins to scattered fair-weather
// cumulus and a clearing opens above the site, so the same layer serves as the cloud sea seen
// from above and as the sky seen from the ground.
import * as THREE from 'three';
import { rng } from '@/lib/three/scenes';
import { CLOUDS, CLEARING, lerp } from './stages';

// Tiling 3D noise. R = billowy base shape (value noise shaped by inverted Worley cells),
// G = finer Worley detail used to erode the edges.
function noiseTexture(size: number) {
  const rand = rng(7919);
  const lattice = (n: number) => { const a = new Float32Array(n * n * n); for (let i = 0; i < a.length; i++) a[i] = rand(); return { n, a }; };
  const cells = (n: number) => { const a = new Float32Array(n * n * n * 3); for (let i = 0; i < a.length; i++) a[i] = rand(); return { n, a }; };
  const V = [lattice(4), lattice(8), lattice(16)];
  const W = [cells(3), cells(6), cells(12), cells(20)];
  const fade = (t: number) => t * t * (3 - 2 * t);

  const value = ({ n, a }: { n: number; a: Float32Array }, x: number, y: number, z: number) => {
    const X = x * n, Y = y * n, Z = z * n;
    const x0 = Math.floor(X), y0 = Math.floor(Y), z0 = Math.floor(Z);
    const fx = fade(X - x0), fy = fade(Y - y0), fz = fade(Z - z0);
    const at = (i: number, j: number, k: number) => a[((i % n) * n + (j % n)) * n + (k % n)];
    const mix = (p: number, q: number, t: number) => p + (q - p) * t;
    return mix(
      mix(mix(at(x0, y0, z0), at(x0 + 1, y0, z0), fx), mix(at(x0, y0 + 1, z0), at(x0 + 1, y0 + 1, z0), fx), fy),
      mix(mix(at(x0, y0, z0 + 1), at(x0 + 1, y0, z0 + 1), fx), mix(at(x0, y0 + 1, z0 + 1), at(x0 + 1, y0 + 1, z0 + 1), fx), fy), fz);
  };
  // 1 at a cell's feature point, falling to 0 at about one cell away.
  const worley = ({ n, a }: { n: number; a: Float32Array }, x: number, y: number, z: number) => {
    const X = x * n, Y = y * n, Z = z * n;
    const cx = Math.floor(X), cy = Math.floor(Y), cz = Math.floor(Z);
    let best = 9;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      const ix = cx + i, iy = cy + j, iz = cz + k;
      const o = ((((ix % n) + n) % n) * n + (((iy % n) + n) % n)) * n * 3 + (((iz % n) + n) % n) * 3;
      const dx = ix + a[o] - X, dy = iy + a[o + 1] - Y, dz = iz + a[o + 2] - Z;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < best) best = d;
    }
    return Math.max(0, 1 - Math.sqrt(best));
  };

  const data = new Uint8Array(size * size * size * 2);
  let o = 0;
  for (let k = 0; k < size; k++) for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const x = i / size, y = j / size, z = k / size;
    const v = value(V[0], x, y, z) * .5 + value(V[1], x, y, z) * .3 + value(V[2], x, y, z) * .2;
    const w = worley(W[0], x, y, z) * .6 + worley(W[1], x, y, z) * .28 + worley(W[2], x, y, z) * .12;
    const base = Math.min(1, Math.max(0, v * .5 + w * .85 - .12));
    const detail = worley(W[2], x, y, z) * .55 + worley(W[3], x, y, z) * .45;
    data[o++] = Math.round(base * 255);
    data[o++] = Math.round(detail * 255);
  }
  const tex = new THREE.Data3DTexture(data, size, size, size);
  tex.format = THREE.RGFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

const vertexShader = /* glsl */ `
varying vec2 vNdc;
void main(){ vNdc = position.xy; gl_Position = vec4(position.xy, 1.0, 1.0); } // z = far plane`;

const fragmentShader = /* glsl */ `
precision highp float;
uniform highp sampler3D uNoise;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform vec3 uCam;
uniform vec3 uSun;
uniform vec3 uLit;
uniform vec3 uShade;
uniform vec3 uHaze;
uniform vec2 uHole;
uniform float uHoleR;
uniform float uCover;
uniform float uTime;
varying vec2 vNdc;

const float Y0 = ${CLOUDS.y0.toFixed(1)};
const float Y1 = ${CLOUDS.y1.toFixed(1)};

// cheap = skip the edge detail (used for the light samples)
float density(vec3 p, bool cheap){
  float h = (p.y - Y0) / (Y1 - Y0);
  if (h < 0.0 || h > 1.0) return 0.0;
  // noise is squeezed vertically so the deck has towers and valleys, not one flat lid
  vec3 q = p * vec3(1.0, 1.9, 1.0) / 2500.0 + vec3(uTime * 0.005, 0.0, uTime * 0.0026);
  float big = texture(uNoise, p / 11000.0 + vec3(0.31, 0.0, 0.67)).r;
  float base = smoothstep(0.18, 0.92, texture(uNoise, q).r);
  // flat-ish bottoms; tops reach higher where the large-scale noise is strong
  float top = 0.45 + 0.55 * smoothstep(0.25, 0.75, big);
  float shape = base * (0.55 + 0.75 * big) * smoothstep(0.0, 0.1, h) * (1.0 - smoothstep(top * 0.45, top, h));
  float d = shape - (1.0 - uCover);
  if (d <= 0.0) return 0.0;
  if (!cheap) {
    float detail = texture(uNoise, q * 4.7 + vec3(0.0, uTime * 0.006, 0.0)).g;
    d = max(0.0, d - detail * 0.34 * (1.0 - smoothstep(0.0, 0.45, d)));
  }
  if (uHoleR > 1.0) d *= smoothstep(uHoleR * 0.45, uHoleR, length(p.xz - uHole));
  return d;
}

void main(){
  vec4 v = uInvProj * vec4(vNdc, 1.0, 1.0);
  vec3 rd = normalize((uCamWorld * vec4(normalize(v.xyz / v.w), 0.0)).xyz);
  if (abs(rd.y) < 1e-4) discard;
  float ta = (Y0 - uCam.y) / rd.y, tb = (Y1 - uCam.y) / rd.y;
  float tn = max(min(ta, tb), 0.0), tf = max(ta, tb);
  if (tf <= 0.0 || tn > 42000.0) discard;
  tf = min(tf, tn + 15000.0);

  float dt = (tf - tn) / float(STEPS);
  // interleaved gradient noise hides the banding of a fixed step count
  float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  float t = tn + dt * jitter;
  vec3 col = vec3(0.0);
  float T = 1.0;
  for (int i = 0; i < STEPS; i++) {
    vec3 p = uCam + rd * t;
    float d = density(p, false);
    if (d > 0.0) {
      float towardSun = density(p + uSun * 60.0, true) + density(p + uSun * 170.0, true) * 1.6 + density(p + uSun * 380.0, true) * 2.2;
      float light = exp(-towardSun * 5.5);
      float h = (p.y - Y0) / (Y1 - Y0);
      // sunlit tops, blue-grey hollows and undersides
      vec3 c = mix(uShade * (0.72 + 0.28 * h), uLit, light);
      c = mix(uHaze, c, exp(-t * 0.00005));
      float a = 1.0 - exp(-d * 0.085 * dt);
      col += T * a * c;
      T *= 1.0 - a;
      if (T < 0.02) break;
    }
    t += dt;
  }
  // drop the faintest haze: with few samples it would only show as dither
  float alpha = clamp((1.0 - T - 0.04) / 0.96, 0.0, 1.0);
  if (alpha <= 0.0) discard;
  gl_FragColor = vec4(col / max(1.0 - T, 1e-3), alpha); // straight alpha: blended after the colour-space conversion
  #include <colorspace_fragment>
}`;

export type Clouds = { mesh: THREE.Mesh; update: (clear: number, time: number, camera: THREE.Camera) => void; dispose: () => void };

export function createClouds(opts: { steps: number; noise: number; sun: THREE.Vector3; haze: string }): Clouds {
  const noise = noiseTexture(opts.noise);
  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    defines: { STEPS: opts.steps },
    uniforms: {
      uNoise: { value: noise },
      uInvProj: { value: new THREE.Matrix4() },
      uCamWorld: { value: new THREE.Matrix4() },
      uCam: { value: new THREE.Vector3() },
      uSun: { value: opts.sun.clone().normalize() },
      uLit: { value: new THREE.Color('#ffffff') },
      uShade: { value: new THREE.Color('#7f8ea8') },
      uHaze: { value: new THREE.Color(opts.haze) },
      uHole: { value: new THREE.Vector2(CLEARING.x, CLEARING.z) },
      uHoleR: { value: 0 },
      uCover: { value: .93 },
      uTime: { value: 0 },
    },
    transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false,
  });
  // One triangle that covers the screen; the vertex shader ignores the camera.
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;

  const u = material.uniforms;
  const shadeAbove = new THREE.Color('#7f8ea8'), shadeBelow = new THREE.Color('#b4bfce');
  return {
    mesh,
    update(clear, time, camera) {
      u.uCover.value = lerp(.92, .45, clear);
      // seen from below, cloud bases are lit by the ground and the open sky: lift the shadow tone
      u.uShade.value.copy(shadeAbove).lerp(shadeBelow, clear);
      u.uHoleR.value = CLEARING.r * Math.pow(clear, .7);
      u.uTime.value = time;
      u.uInvProj.value.copy(camera.projectionMatrixInverse);
      u.uCamWorld.value.copy(camera.matrixWorld);
      u.uCam.value.setFromMatrixPosition(camera.matrixWorld);
      // Above the deck the clouds lie in front of the land, so they are drawn over everything.
      // Below it they are part of the sky: the depth test lets trees, houses and people cover them.
      material.depthTest = u.uCam.value.y < CLOUDS.y0;
    },
    dispose() { noise.dispose(); geometry.dispose(); material.dispose(); },
  };
}
