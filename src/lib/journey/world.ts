// The one shared 3D world for the whole journey: sky, daylight, the neighbourhood and the
// clouds. Later stages (founder, hotel as blueprint / construction / finished / model) add
// their objects to this same root and get their state from the same update(p) call.
import * as THREE from 'three';
import { disposeObject } from '@/lib/three/scenes';
import { createClouds } from './clouds';
import { createFounder } from './founder';
import { buildSite } from './site';
import { clamp, sampleCamera, smooth, stageT, type Quality, type Shot } from './stages';

const PI = Math.PI; // physical light units, as in lib/three/scenes.ts
const HAZE = '#dbe5ec';
const SUN = new THREE.Vector3(-.37, .77, .53).normalize(); // from the front-left, about 50° up

function skyDome() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { top: { value: new THREE.Color('#3f76ba') }, mid: { value: new THREE.Color('#9dbfe0') }, hor: { value: new THREE.Color(HAZE) }, sun: { value: SUN } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: /* glsl */ `uniform vec3 top;uniform vec3 mid;uniform vec3 hor;uniform vec3 sun;varying vec3 vP;
void main(){
  vec3 d=normalize(vP);float h=max(d.y,0.0);
  vec3 c=mix(hor,mid,smoothstep(0.0,0.16,h));
  c=mix(c,top,smoothstep(0.1,0.75,h));
  c+=vec3(1.0,0.95,0.85)*pow(max(dot(d,sun),0.0),24.0)*0.12;
  gl_FragColor=vec4(c,1.0);
  #include <colorspace_fragment>
}`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(40000, 32, 16), material);
  mesh.renderOrder = -1; mesh.frustumCulled = false;
  return mesh;
}

export type JourneyWorld = ReturnType<typeof createJourneyWorld>;

export function createJourneyWorld(q: Quality) {
  const root = new THREE.Group();
  const fog = new THREE.FogExp2(HAZE, .00013);

  const sky = skyDome();
  root.add(sky);
  root.add(new THREE.HemisphereLight('#dbe7f4', '#a8997c', .46 * 1.35 * PI));
  const sun = new THREE.DirectionalLight('#fff2dc', 2.5 * PI);
  sun.position.copy(SUN).multiplyScalar(420);
  if (q.shadow) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(q.shadow, q.shadow);
    Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 1, far: 1000 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -.0005; sun.shadow.normalBias = .08;
  }
  root.add(sun); root.add(sun.target);

  const site = buildSite(q);
  root.add(site.group);

  const founder = createFounder(SUN);
  root.add(founder.group);

  const clouds = createClouds({ steps: q.cloudSteps, noise: q.noise, sun: SUN, haze: HAZE });
  root.add(clouds.mesh);

  const shot: Shot = { pos: [0, 0, 0], look: [0, 0, 0], fov: 45 };

  return {
    root, fog, exposure: .8,
    // The whole scene state for a master progress value. `time` only drifts the clouds.
    update(p: number, time: number, camera: THREE.PerspectiveCamera, aspect: number) {
      sampleCamera(p, aspect, shot);
      camera.position.set(...shot.pos);
      camera.lookAt(...shot.look);
      camera.aspect = aspect; camera.fov = shot.fov;
      camera.near = clamp(camera.position.y * .03, .5, 30); camera.far = 60000;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      sky.position.copy(camera.position);
      founder.update(p);
      clouds.update(smooth(stageT('reveal', p)), time, camera);
    },
    dispose() { founder.dispose(); clouds.dispose(); site.noise.dispose(); disposeObject(root); },
  };
}
