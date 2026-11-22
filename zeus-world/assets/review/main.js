// Standard review scene (asset bible 1.9, check 6): the new item beside the reference villa and a citizen,
// on a 2 m grid, in daylight or dusk. Normalised models are placed exactly as exported: no scaling here,
// so whatever looks wrong here is wrong in the file.
//
// ?m=models/<file>.glb  the item under review (several: comma separated, laid out left to right)
// ?view=3q|front|back|side|top   ?light=day|dusk   ?label=text
// ?props  close-up for small items: tight spacing, no home-slot outlines, camera framed on the items and the citizen
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const q = new URLSearchParams(location.search);
const items = (q.get('m') || '').split(',').filter(Boolean);
const view = q.get('view') || '3q', light = q.get('light') || 'day';
document.getElementById('label').textContent = q.get('label') || `${items.join(' + ')} · ${view} · ${light}`;

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 500);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;

const L = {
  day: { sky: 0xcfe2f2, ground: 0x8fb36a, sun: 0xfff1dc, sunI: 2.8, sunPos: [-12, 20, 14], hemi: 0.8, env: 0.55, exp: 1.0 },
  dusk: { sky: 0xf0b98a, ground: 0x7d9a5c, sun: 0xffa865, sunI: 2.4, sunPos: [-18, 6, 10], hemi: 0.45, env: 0.35, exp: 1.05 },
}[light];
scene.background = new THREE.Color(L.sky); scene.environmentIntensity = L.env; renderer.toneMappingExposure = L.exp;
scene.add(new THREE.HemisphereLight(0xffffff, 0x7a6a48, L.hemi));
const sun = new THREE.DirectionalLight(L.sun, L.sunI); sun.position.set(...L.sunPos); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 }); scene.add(sun);

// ground with the 2 m build grid
const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: L.ground, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const grid = new THREE.GridHelper(40, 20, 0x4d6b35, 0x5f7f44); grid.position.y = 0.005; grid.material.transparent = true; grid.material.opacity = 0.35; scene.add(grid);
// +Z arrow so the front is unambiguous in every view
const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-9, 0.02, 6), 2, 0xd23c3c, 0.6, 0.4); scene.add(arrow);

const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const load = async (url) => { const g = await loader.loadAsync(url); g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); return g.scene; };
const boxOf = (o) => new THREE.Box3().setFromObject(o);

// reference villa (plaster + terracotta + doric), assembled the way the builder does it
async function villa() {
  const g = new THREE.Group();
  const fitBox = (o, w, h, d) => { const hold = new THREE.Group(); hold.add(o); let b = boxOf(o), s = b.getSize(new THREE.Vector3());
    if (s.z > s.x) { o.rotation.y = Math.PI / 2; b = boxOf(o); s = b.getSize(new THREE.Vector3()); }
    const c = b.getCenter(new THREE.Vector3()); o.position.set(-c.x, -b.min.y, -c.z); hold.scale.set(w / s.x, h / s.y, d / s.z); return hold; };
  const [w, r, p] = await Promise.all(['body_plaster', 'roof_terracotta', 'porch_doric'].map((n) => load(`./ref/${n}.glb`)));
  const W = 6.4, D = 4.4, H = 3.0;
  const wall = fitBox(w, W, H, D); g.add(wall);
  const roof = fitBox(r, W + 0.9, 2.3, D + 1.1); roof.position.y = H - 0.12; g.add(roof);
  const porch = fitBox(p, W + 0.2, H + 0.1, 1.9); porch.position.z = D / 2 + 0.85; g.add(porch);
  return g;
}
// footprint outline of the 6.4 x 4.4 m home slot
function slot(x) {
  const pts = [[-3.2, -2.2], [3.2, -2.2], [3.2, 2.2], [-3.2, 2.2], [-3.2, -2.2]].map(([a, b]) => new THREE.Vector3(a + x, 0.02, b));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffffff })));
}

const ref = await villa(); ref.position.x = -8; scene.add(ref); slot(-8);
const props = q.has('props'), gap = props ? 0.6 : 3;
const xs = []; let x = 0, top = 1.75;
for (const url of items) { const o = await load(url); const b = boxOf(o); x += -b.min.x; o.position.x = x; scene.add(o); if (!props) slot(x); xs.push(x); x += b.max.x + gap; top = Math.max(top, b.max.y); }
const cit = await load('./ref/citizen.glb'); { const b = boxOf(cit); const s = 1.75 / (b.max.y - b.min.y); cit.scale.setScalar(s); cit.position.set(props ? -1.2 : (xs[0] ?? 0) + 2.2, -b.min.y * s, props ? 0 : 3.4); scene.add(cit); }

const minX = props ? -1.8 : -11.6, maxX = x - gap, cx = (minX + maxX) / 2, span = Math.max(maxX - minX, props ? top * 1.6 : 0);
const target = new THREE.Vector3(cx, props ? top * 0.45 : 1.4, 0);
const cams = { '3q': [cx + span * 0.5, span * 0.5, span * 0.95], front: [cx, 2.2, span * 1.15], back: [cx, 2.2, -span * 1.15], side: [cx + span, 2.5, 0.01], top: [cx, span * 1.25, 0.01] };
camera.position.set(...cams[view]); camera.lookAt(target);
const controls = new OrbitControls(camera, renderer.domElement); controls.target.copy(target); controls.update();
if (q.has('shot')) renderer.render(scene, camera); // one frame for stills: software GL is slow
else renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
window.ready = true;
