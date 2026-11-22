// Name plates over the homes, so each citizen can find their house from the usual high camera.
// A plate stands above the roof, always faces the camera, and never gets smaller on screen than a readable size.
// The names are made up for the demo; in the real game they would be the owners' handles.
import * as THREE from 'three';

export function createNames({ scene, camera, renderer, tickers, dn }) {
  const plates = [], MIN_PX = 20, BASE = 0.85, MAX = 3.6;   // smallest height on screen in pixels; height in metres when close; largest it may grow to
  function texture(name) {
    const c = document.createElement('canvas'), g = c.getContext('2d'), F = '700 60px system-ui, sans-serif'; g.font = F;
    const tw = g.measureText(name).width, h = 112, w = Math.ceil(tw + 150); c.width = w; c.height = h; g.font = F;
    g.beginPath(); g.roundRect(5, 5, w - 10, h - 10, 26); g.fillStyle = '#f7f1e2'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#d9a93a'; g.stroke();   // cream marble with a gold rim
    g.fillStyle = '#e2a92e'; g.beginPath(); for (const [x, y] of [[62, 22], [38, 60], [54, 60], [44, 92], [74, 50], [57, 50], [68, 22]]) g.lineTo(x, y); g.closePath(); g.fill();   // Zeus's bolt
    g.fillStyle = '#1d2a4a'; g.textBaseline = 'middle'; g.fillText(name, 92, h / 2 + 3);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return { t, aspect: w / h };
  }
  // object: the building (or the list of its parts); the plate sits over the middle of the first part, just above the highest point
  function add(object, name) {
    const parts = [].concat(object); for (const p of parts) p.updateWorldMatrix(true, true);   // a part inside a group that has not been drawn yet does not know where it is
    const box = new THREE.Box3(), first = new THREE.Box3().setFromObject(parts[0]); for (const p of parts) box.expandByObject(p);
    const { t, aspect } = texture(name), s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, toneMapped: false }));
    s.center.set(0.5, 0); s.position.set((first.min.x + first.max.x) / 2, box.max.y + 0.35, (first.min.z + first.max.z) / 2); s.userData.aspect = aspect; scene.add(s); plates.push(s); size(s); return s;
  }
  function size(s) { const perPx = 2 * camera.position.distanceTo(s.position) * Math.tan(camera.fov * Math.PI / 360) / renderer.domElement.clientHeight, h = Math.min(MAX, Math.max(BASE, MIN_PX * perPx)); s.scale.set(h * s.userData.aspect, h, 1); }
  tickers.push(() => { const k = 1 - 0.3 * dn.d; for (const s of plates) { size(s); s.material.color.setScalar(k); } });   // a little dimmer at dusk, since the plate is not lit by the scene
  return { add, count: () => plates.length };
}
