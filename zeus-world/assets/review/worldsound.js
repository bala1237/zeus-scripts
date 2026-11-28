// The sound of the open world (ZW-054, item 6): ambience that follows the camera. Fourteen short loops (public/sound/*.webm, made by
// assets/sound.sh); how loud each one plays is worked out a few times a second from where the camera is, how high it is, the hour and
// the weather, and eased towards, so that flying from the forest to the shore is a slow cross-fade and a cut between shots a quick one.
//   const sound = createSound({ heightAt, forestAt, riverNear, places, spots, lamps, air });
//   sound.start()   after a click (browsers do not let a page make sound before one; a browser source in OBS is allowed to)
//   sound.update(cameraPosition, dt)   every frame        sound.thunder(metresAway)        sound.on / sound.toggle()
const NAMES = ['country', 'forest', 'river', 'mill', 'sea', 'gulls', 'market', 'sheep', 'rain', 'fire', 'night', 'falls', 'wind'];
const near = (d, full, none) => Math.min(1, Math.max(0, (none - d) / (none - full)));

export function createSound({ heightAt, forestAt, riverNear, places, spots, lamps, air, volume = 0.8 }) {
  let ctx = null, master = null, on = false, clock = 0, thunderBuf = null; const layer = {}, want = Object.fromEntries(NAMES.map((n) => [n, 0])), fires = lamps.filter((l) => l.kind === 'fire');
  const load = async (n) => ctx.decodeAudioData(await (await fetch(`./sound/${n}.webm`)).arrayBuffer());
  async function start() { if (ctx) { await ctx.resume(); on = true; master.gain.setTargetAtTime(volume, ctx.currentTime, 0.4); return true; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return false; } master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination); on = true; await ctx.resume().catch(() => {});
    // every loop starts as soon as it has loaded, silent, at a different point of itself; only its loudness changes after that
    for (const n of NAMES) load(n).then((buf) => { const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = buf; src.loop = true; src.loopEnd = Math.floor(buf.duration); g.gain.value = 0; src.connect(g).connect(master); src.start(0, Math.random() * Math.floor(buf.duration)); layer[n] = g; }).catch((e) => console.warn('sound missing', n, e.message));
    load('thunder').then((b) => { thunderBuf = b; }).catch(() => {}); master.gain.setTargetAtTime(volume, ctx.currentTime, 1.2); return ctx.state === 'running'; }
  // the whole sound louder or quieter, 0 to 1, eased so that it never jumps (ZW-065)
  function setVolume(v) { volume = Math.max(0, Math.min(1, Number(v) || 0)); if (ctx && on) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.15); }
  function stop() { on = false; if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.3); }

  function update(cam, dt) { if (!ctx || !on) return; clock += dt; if (clock < 0.2) return; clock = 0;
    const ground = heightAt(cam.x, cam.z), alt = cam.y - Math.max(0, ground), low = near(alt, 30, 260), now = air.now, night = now === 'night', storm = now === 'storm', dusk = now === 'dusk' || now === 'dawn';
    const to = (p, r0, r1) => near(Math.hypot(cam.x - p.x, cam.z - p.z), r0, r1), forest = forestAt(cam.x, cam.z), r = riverNear(cam.x, cam.z), sea = ground < 0 ? 1 : near(ground, 1.5, 9) * near(Math.abs(cam.x), 120, 420);
    const town = Math.max(to(places.village, 40, 190), spots.harbour ? to(spots.harbour, 30, 170) : 0, 0.8 * to(places.city, 60, 260)), flock = Math.max(...spots.huts.map((h) => to(h, 25, 150)), ...spots.farms.map((f) => 0.7 * to({ x: f.pen[0], z: f.pen[1] }, 12, 80)), 0);
    const fire = fires.length ? Math.max(...fires.map((f) => near(Math.hypot(cam.x - f.x, cam.z - f.z, cam.y - f.y), 3, 32))) : 0, quiet = storm ? 0.25 : 1;
    want.country = (night ? 0 : dusk ? 0.3 : 0.5) * low * (1 - 0.7 * forest) * (1 - 0.7 * sea) * quiet; want.forest = (night ? 0 : 0.7) * forest * low * quiet; want.night = night ? 0.6 * low * (1 - 0.6 * sea) : dusk ? 0.2 * low : 0;
    want.river = 0.75 * near(r.d, r.w + 6, r.w + 90) * near(alt, 12, 120) * (1 - to(places.falls, 100, 500)); want.falls = 0.9 * to(places.falls, 90, 700) * near(alt, 60, 500);
    want.mill = spots.mill ? 0.8 * near(Math.hypot(cam.x - spots.mill.x, cam.z - spots.mill.z, cam.y - spots.mill.y), 12, 70) : 0; want.sea = 0.7 * sea * near(alt, 25, 220);
    want.gulls = 0.5 * Math.max(spots.harbour ? to(spots.harbour, 60, 320) : 0, to({ x: 112, z: 4 }, 60, 300)) * near(alt, 40, 260) * (night ? 0 : 1) * quiet; want.market = (night ? 0.12 : 0.55) * town * near(alt, 20, 140) * quiet;
    want.sheep = 0.6 * flock * near(alt, 15, 110) * (night ? 0.25 : 1) * quiet; want.fire = 0.8 * fire * (night || dusk || storm ? 1 : 0.35); want.rain = storm ? 0.85 : 0; want.wind = Math.max(0.55 * (1 - low), storm ? 0.4 : 0.04);
    for (const n of NAMES) if (layer[n]) layer[n].gain.setTargetAtTime(want[n], ctx.currentTime, 0.9); }

  // thunder after a stroke of lightning: later and softer the further off it was
  function thunder(metres = 4000) { if (!ctx || !on || !thunderBuf) return; const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = thunderBuf; g.gain.value = Math.min(1, 0.5 + 2500 / (metres + 1500)); s.connect(g).connect(master); s.start(ctx.currentTime + Math.min(4, metres / 2400)); }
  return { start, stop, update, thunder, setVolume, get volume() { return volume; }, toggle: () => (on ? (stop(), false) : (start(), true)), get on() { return on; }, get running() { return !!ctx && ctx.state === 'running' && on; }, levels: () => ({ ...want }) };
}
