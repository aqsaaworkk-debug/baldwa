// Paper material: MeshStandardMaterial (so the lamp lighting still works) with a vertex shader that bends and rolls the sheet.
//
// Geometry is a PlaneGeometry in the paper's own space: x across, y from -0.5 (bottom edge) to 0.5 (top edge).
// uRoll (0..1, driven by scroll) moves the roll line rollY from the bottom edge to the top. Vertices below it wrap round a
// cylinder that curls up towards the camera: angle = (rollY - y) / radius, y = rollY - r sin(angle), z = R - r cos(angle)
// (the brief's formula, mirrored for a roll that starts at the bottom edge). The radius changes slowly along the paper
// (uGap per turn) so it winds into a real spiral whose turns never cut through each other; uTaper makes the tube slightly
// conical, like a sheet rolled by hand. Normals come from the same maths, so the lamp lights the curl correctly.
// Realism in the fragment shader: a contact shadow where the tube sits on the flat sheet, darker inner turns, and the plain
// back of the sheet with the ink faintly showing through.
import * as THREE from 'three';

export type PaperUniforms = {
  uRoll: { value: number }; uRadius: { value: number }; uGap: { value: number }; uTaper: { value: number };
  uBend: { value: number }; uShade: { value: number };
  uTint: { value: THREE.Color }; uHighlight: { value: number }; uBack: { value: THREE.Color };
};

export function createPaperMaterial(map: THREE.Texture) {
  const uniforms: PaperUniforms = {
    uRoll: { value: 0 }, uRadius: { value: .03 }, uGap: { value: .007 }, uTaper: { value: .08 },
    uBend: { value: 0 }, uShade: { value: .35 },
    uTint: { value: new THREE.Color('#fff1df') }, uHighlight: { value: .12 }, uBack: { value: new THREE.Color('#f1ece4') },
  };
  // transparent (with alpha test and depth write): it then shares the transparent pass with the shadow, which is drawn first.
  // forceSinglePass: one draw with culling off (three's default two-pass draw for double-sided transparent materials flips
  // gl_FrontFacing in the back pass, which would print the writing on the outside of the tube).
  const mat = new THREE.MeshStandardMaterial({
    map, side: THREE.DoubleSide, alphaTest: .5, transparent: true, forceSinglePass: true, roughness: .8, metalness: 0,
  });

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', /* glsl */ `#include <common>
uniform float uRoll, uRadius, uGap, uTaper, uBend;
varying float vTurn;   // angle wound round the tube (radians), -1 on the flat part
varying float vAbove;  // flat part: distance above the roll line, in units of the tube radius
// p: position in paper space, n: its normal. Bend first (an arch along y), then the roll.
void paperDeform(inout vec3 p, out vec3 n) {
  float by = p.y * 2.0;                                 // -1 .. 1 along the sheet
  p.z += uBend * (1.0 - by * by);
  n = normalize(vec3(0.0, uBend * 4.0 * by, 1.0));      // -dz/dy
  float rollY = -0.5 + uRoll * 1.002;                   // 1.002: the last sliver goes in too
  float r0 = uRadius * (1.0 + uTaper * p.x);            // slightly conical
  float s = rollY - p.y;                                // arc length past the roll line
  vTurn = -1.0;
  vAbove = uRoll > 0.0 ? max(-s, 0.0) / r0 : 1e3;
  if (s > 0.0) {
    float L = rollY + 0.5;                              // length rolled up so far
    float b = uGap / 6.2831853;                         // radius change per radian
    float R = sqrt(r0 * r0 + 2.0 * b * L);              // outer radius: the tube grows as more paper goes in
    float th = b > 1e-6 ? (R - sqrt(max(R * R - 2.0 * b * s, 0.0))) / b : s / R;
    float r = R - b * th;                               // tightens towards the free edge, inside the tube
    p.y = rollY - r * sin(th);
    p.z = R - r * cos(th);                              // axis at depth +R, in front of the sheet: curls towards the camera
    n = vec3(0.0, sin(th), cos(th));
    vTurn = th;
  }
}`)
      .replace('#include <beginnormal_vertex>', /* glsl */ `vec3 paperPos = position; vec3 objectNormal;
paperDeform(paperPos, objectNormal);`)
      .replace('#include <begin_vertex>', 'vec3 transformed = paperPos;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform vec3 uTint, uBack; uniform float uHighlight, uShade;
varying float vTurn, vAbove;`)
      // the sheet is solid paper: once past the alpha test (its torn edges), fully opaque (the PNG is slightly see-through)
      .replace('#include <alphatest_fragment>', `#include <alphatest_fragment>
diffuseColor.a = 1.0;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
// back of the sheet: plain paper, the ink faintly showing through (it's thin paper)
if (!gl_FrontFacing) {
  float ink = 1.0 - smoothstep(.35, .7, dot(diffuseColor.rgb, vec3(.299, .587, .114)));
  diffuseColor.rgb = uBack * (1.0 - .035 * ink);
}
diffuseColor.rgb *= uTint;
// contact shadow just above the roll line, where the tube sits on the sheet
diffuseColor.rgb *= 1.0 - uShade * 1.1 * exp(-vAbove * 1.1);
// inner turns of the spiral (past the first full turn, 2π) get less light
if (vTurn > 0.0) diffuseColor.rgb *= 1.0 - uShade * smoothstep(6.3, 9.0, vTurn);`)
      // faint highlight on the right side (the lamp is top right); on the tube, cylinder shading: lit along the top, falling
      // off underneath, with a soft sheen line where it faces the lamp (normal is in view space here)
      .replace('#include <opaque_fragment>', `outgoingLight += uHighlight * smoothstep(.45, 1.0, vMapUv.x) * smoothstep(0.0, .9, vMapUv.y) * vec3(1.0, .93, .82);
if (vTurn > 0.0) {
  float up = normal.y;
  outgoingLight *= mix(1.0 - uShade * .95, 1.08, smoothstep(-.95, .85, up));
  outgoingLight += uShade * .35 * pow(max(up, 0.0), 10.0) * vec3(1.0, .95, .86);
}
#include <opaque_fragment>`);
  };
  return { material: mat, uniforms };
}

// Soft blob shadow: a blurred rounded rectangle, drawn once. `spread` leaves room around the sheet for the blur
// (larger = softer).
export function createShadowTexture(aspect: number, spread: number) {
  const H = 256, W = Math.round(H * aspect);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  const iw = W / spread, ih = H / spread, blur = (H - ih) * .45;
  // draw the rectangle off-canvas and keep only its blurred shadow (canvas `filter` isn't supported everywhere)
  ctx.shadowColor = 'rgb(38,24,12)'; ctx.shadowBlur = blur; ctx.shadowOffsetX = W * 2; // warm dark brown, like the table's own shadows
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.roundRect((W - iw) / 2 - W * 2, (H - ih) / 2, iw, ih, iw * .03);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
