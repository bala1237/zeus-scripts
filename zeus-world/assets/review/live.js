// Zeus Live (ZW-059): every scene behind one address. The scenes stay the pages they are (world.html, laser.html, …); this page
// holds one of them at a time in a frame. It has two faces, chosen by where it runs:
//   in OBS (or with ?ui=0)  the picture. Nothing but the scene. It changes scene when told, and hands a scene the orders meant for it.
//   in a browser            the control room. A tab for each scene, with that scene's own controls, one connection to OBS for all
//                           of them, and "Show this in OBS", which changes what the stream sees. Looking at a tab changes nothing in OBS.
//   ?scene=laser  the scene to start with      ?obsport=4455      ?obs=0 do not connect by itself
// Messages, as events OBS hands to its browser sources (and between two tabs of one browser, for trying it without OBS):
//   zeusLive  { cmd: 'show', scene, opts }      zeusWorld, zeusHero: passed on to that scene (a hero film told to play is shown first)
// From outside (TikFinity later): window.zeusShow('hero')
import { connectObs } from './obsremote.js';
import { pageQuery, onceOnly } from './source.js';

// event: the orders a scene takes; hint: an example for the "Settings in OBS" box
export const SCENES = {
  world: { name: 'Open world', page: 'world.html', event: 'zeusWorld', hint: 'light=dusk' },
  city: { name: 'City', page: 'city.html', event: 'zeusCity', hint: 'view=plaza' },
  laser: { name: 'Lasers', page: 'laser.html', hint: 'input=rode  or  bpm=128' },
  liquid: { name: 'Liquid sky', page: 'liquid.html', event: 'zeusLiquid', hint: 'pal=aurora' },
  stage: { name: 'Music stage', page: 'stage.html', hint: 'bpm=128' },
  hero: { name: 'Hero film', page: 'hero.html', event: 'zeusHero', hint: 'captions=1' },
  andie: { name: "Andie's Place", page: 'andie.html', hint: 'bpm=124' },
};
const q = pageQuery(), $ = (id) => document.getElementById(id), OUT = q.get('ui') === '0', view = $('view');
const store = { get: (k) => { try { return localStorage.getItem('live-' + k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem('live-' + k, v); } catch { /* private window */ } } };
const chan = 'BroadcastChannel' in window ? new BroadcastChannel('zeus-live') : null;
const address = (key, opts, plain) => { const p = new URLSearchParams(opts || ''); if (plain) p.set('ui', '0'); else p.delete('ui'); const s = p.toString(); return `./${SCENES[key].page}${s ? '?' + s : ''}`; };
const first = SCENES[q.get('scene')] ? q.get('scene') : null;

if (OUT) { // ---------- the picture
  document.body.classList.add('out'); const curtain = $('curtain'), fresh = onceOnly(true), kept = {}; let now = null, nowOpts = '', listening = false, swap = 0, lift = 0;
  const hand = (key, name, detail) => { try { view.contentWindow.dispatchEvent(new view.contentWindow.CustomEvent(name, { detail })); } catch { /* the frame is between pages */ } };
  function show(key, opts = '') { if (!SCENES[key] || (key === now && opts === nowOpts)) return; now = key; nowOpts = opts; listening = false; store.set('scene', key); store.set('opts', opts);
    // dark for a moment, so that a scene is never seen half loaded; the scene before is thrown away, and its memory with it
    curtain.classList.add('on'); clearTimeout(swap); clearTimeout(lift); swap = setTimeout(() => { view.src = address(key, opts, true); }, 360); lift = setTimeout(open, 5000); }   // never dark for more than five seconds, whatever the scene does
  const open = () => { clearTimeout(lift); curtain.classList.remove('on'); };
  view.addEventListener('load', () => { if (view.src) setTimeout(open, 150); });
  // a scene says when it listens; what was kept for it is handed over then
  addEventListener('message', (e) => { if (e.origin !== location.origin || !e.data?.zeusReady || e.data.zeusReady !== now) return; listening = true; if ((kept[now] || []).length) open(); for (const [name, d] of kept[now] || []) hand(now, name, d); kept[now] = []; });   // an order was waiting (a film to play): show it at once
  const order = (m) => { if (!m || typeof m !== 'object') return; if (m.cmd === 'show') show(m.scene, m.opts || ''); };
  addEventListener('zeusLive', (e) => { if (fresh(e.detail)) order(e.detail); }); if (chan) chan.onmessage = (e) => order(e.data);
  for (const [key, s] of Object.entries(SCENES)) if (s.event) addEventListener(s.event, (e) => { const d = e.detail;
    if (key !== now) { if (key === 'hero' && d?.cmd === 'play') show('hero', store.get('opts-hero') || ''); else return; }   // an order for a scene that is not on screen is dropped; a film told to play comes on screen
    if (listening) hand(key, s.event, d); else (kept[key] ||= []).push([s.event, d]); });
  // OBS tells its sources when they are shown and hidden; the hero film starts over on that
  for (const name of ['obsSourceVisibleChanged', 'obsSourceActiveChanged']) addEventListener(name, (e) => hand(now, name, e.detail));
  window.zeusShow = show; show(first || (SCENES[store.get('scene')] ? store.get('scene') : 'world'), first ? '' : store.get('opts') || '');
} else { // ---------- the control room
  let tab = first || (SCENES[store.get('tab')] ? store.get('tab') : 'world'), sent = SCENES[store.get('sent')] ? store.get('sent') : null, obs = null, n = Date.now(), again = 0, tries = 0;
  const say = (t) => { $('obsStatus').textContent = t; }, wrap = $('wrap'), fit = () => { wrap.style.top = $('bar').offsetHeight + 'px'; }; new ResizeObserver(fit).observe($('bar')); fit();
  const mark = () => { for (const b of $('tabs').children) { b.classList.toggle('on', b.dataset.k === tab); b.classList.toggle('live', b.dataset.k === sent); }
    $('onAir').textContent = sent ? `OBS was last told: ${SCENES[sent].name}` : 'OBS has not been told a scene yet'; $('show').textContent = sent === tab ? `Send ${SCENES[tab].name} to OBS again` : `Show ${SCENES[tab].name} in OBS`; };
  function open(key) { tab = key; store.set('tab', key); $('opts').value = store.get('opts-' + key) || ''; $('opts').placeholder = SCENES[key].hint; view.src = address(key, '', false); mark(); }
  for (const [k, s] of Object.entries(SCENES)) { const b = document.createElement('button'); b.textContent = s.name; b.dataset.k = k; b.addEventListener('click', () => { if (k !== tab) open(k); }); $('tabs').append(b); }
  $('opts').addEventListener('change', () => store.set('opts-' + tab, $('opts').value.trim().replace(/^[?&]+/, '').replace(/\s+/g, '')));
  // the one connection to OBS. The scenes' own pages, shown here in the frame, send their orders through it (window.zeusLive).
  const emit = async (name, data) => { if (!obs) throw new Error('not connected to OBS (the bar at the top)'); await obs.emit(name, { ...data, _n: ++n }); if (name === 'zeusHero' && data?.cmd === 'play' && sent !== 'hero') { sent = 'hero'; store.set('sent', sent); mark(); } };
  window.zeusLive = { emit, connected: () => !!obs };
  $('show').addEventListener('click', async () => { const m = { cmd: 'show', scene: tab, opts: store.get('opts-' + tab) || '' }; chan?.postMessage(m);
    try { await emit('zeusLive', m); sent = tab; store.set('sent', sent); mark(); view.contentWindow.dispatchEvent(new CustomEvent('zeusShown')); } catch (e) { say(e.message); } });
  // if OBS drops the connection, say why and join again (as the world's remote does, ZW-055)
  const connect = async () => { clearTimeout(again); if (obs) return; say('connecting');
    try { obs = await connectObs({ password: $('obsPass').value, port: Number(q.get('obsport')) || 4455, onClose: (e) => { obs = null; const why = { 4009: 'OBS refused the password', 4011: 'OBS restarted its WebSocket server', 1001: 'OBS was closed', 1006: 'OBS went away' }[e?.code] || `code ${e?.code ?? '?'}`; say(`connection to OBS closed (${why}); trying again…`); again = setTimeout(connect, 3000); } });
      store.set('obspass', $('obsPass').value); tries = 0; const src = await obs.findBrowserSource('live.html').catch(() => null);
      say(src ? `connected · source "${src.name}"` : 'connected, but OBS has no browser source with live.html in its address: add one with "Copy the address for OBS"'); }
    catch (e) { obs = null; const retry = tries++ < 20 && !/password/.test(e.message); say(e.message + (retry ? '; trying again…' : '')); if (retry) again = setTimeout(connect, 3000); } };
  const old = () => { try { return localStorage.getItem('world-obspass') ?? localStorage.getItem('hero-obspass'); } catch { return null; } };   // the password typed on the older pages
  $('obsPass').value = store.get('obspass') ?? old() ?? ''; $('obsConnect').addEventListener('click', () => { tries = 0; if (obs) { obs.close(); obs = null; } connect(); });
  $('copy').addEventListener('click', async () => { const link = `${location.origin}${location.pathname}`, b = $('copy'); try { await navigator.clipboard.writeText(link); b.textContent = 'Copied'; } catch { prompt('Copy this address into the browser source:', link); } setTimeout(() => { b.textContent = 'Copy the address for OBS'; }, 1600); });
  open(tab); if ((store.get('obspass') ?? old()) != null && q.get('obs') !== '0') connect();
}
