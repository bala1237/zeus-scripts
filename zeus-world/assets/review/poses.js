// Contact sheet of an animation, since motion cannot be watched on the build machine: the character at evenly spaced
// moments of one clip, seen from the side (top row) and the front (bottom row).
// ?m=models/char_citizen_woman.glb&clip=Walk&n=8   (clip: Walk, Idle, Cheer, Clap, Stand, none)   node shot.mjs renders/x.png "m=...&clip=Walk" with PAGE=poses.html
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { standClip } from './stand.js';
import { soldierKit } from './soldier.js';
const q = new URLSearchParams(location.search), url = './' + (q.get('m') || 'models/char_citizen_woman.glb'), clipName = q.get('clip') || 'Walk', n = Number(q.get('n') || 8);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(innerWidth, innerHeight); document.body.prepend(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xe9eef2);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(3, 6, 8); scene.add(sun);
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); const g = await loader.loadAsync(url);
// ?kit=us|them shows a battle soldier with his gear (clips: March, Guard, Thrust)
const kit = q.get('kit') ? await soldierKit({ get: (u) => loader.loadAsync(u), url }) : null;
const clip = clipName === 'Stand' ? standClip(g.scene) : g.animations.find((c) => c.name === clipName) || g.animations[0];   // Stand is the pose made in code (stand.js)
document.getElementById('label').textContent = `${url.split('/').pop()} · ${clip.name} · ${clip.duration.toFixed(2)} s · clips: ${g.animations.map((c) => c.name).join(', ')}`;
if (q.has('cut')) { renderer.localClippingEnabled = true; const cut = Number(q.get('cut')); g.scene.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.side = THREE.DoubleSide; m.material.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, -1), cut)]; } }); }   // ?cut=0 slices the character open through the middle, seen from the side
const gap = 1.25, rows = [[Math.PI / 2, 1.15], [0, -1.05]];
if (kit) { for (const [yaw, y] of rows) for (let i = 0; i < n; i++) { const sol = kit.make(q.get('kit')); sol.play(clipName, 1, 0); const a = sol.acts[clipName]; sol.mixer.setTime(a.getClip().duration * i / n); sol.g.position.set((i - (n - 1) / 2) * gap, y - 0.9, 0); sol.g.rotation.y = yaw; scene.add(sol.g); } }
else for (const [yaw, y] of rows) for (let i = 0; i < n; i++) { const o = SkeletonUtils.clone(g.scene); o.traverse((m) => { if (m.isMesh) m.frustumCulled = false; });
  const hold = new THREE.Group(); hold.add(o); hold.updateMatrixWorld(true); o.traverse((m) => { if (m.isSkinnedMesh) m.skeleton.update(); });
  const b = new THREE.Box3().setFromObject(o, true); hold.scale.setScalar(1.75 / (b.max.y - b.min.y));
  if (clipName !== 'none') { const mx = new THREE.AnimationMixer(o); mx.clipAction(clip).play(); mx.setTime(clip.duration * i / n); }
  hold.position.set((i - (n - 1) / 2) * gap, y - 0.9, 0); hold.rotation.y = yaw; scene.add(hold);
  const line = new THREE.Mesh(new THREE.BoxGeometry(gap * 0.9, 0.01, 0.01), new THREE.MeshBasicMaterial({ color: 0x8090a0 })); line.position.set(hold.position.x, hold.position.y, 0); scene.add(line); }
const w = n * gap / 2 + 0.3, h = w * innerHeight / innerWidth, camera = new THREE.OrthographicCamera(-w, w, h, -h, 0.1, 50); camera.position.set(0, 0.1, 10); camera.lookAt(0, 0.1, 0);
renderer.render(scene, camera); window.__dbg = { THREE, g, SkeletonUtils, clip }; window.ready = true;
