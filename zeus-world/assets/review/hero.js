// Plays a hero film (ZW-047) and draws the hero's name into it. herofilms.js is the library; this is the player.
//   ?film=fire-bringer   ?name=Andie Howard   ?ui=0 (no controls; plays when the page is clicked or, if the browser allows, at once)
//   ?autoplay   ?captions   ?shot&t=34 (one still at that second, for checking)
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/800.css';
import '@fontsource/cinzel/900.css';
import '@fontsource/cinzel-decorative/700.css';
import '@fontsource/cormorant-sc/700.css';
import '@fontsource/marcellus-sc/400.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import { FILMS, showName, slug, span } from './herofilms.js';
import { connectObs } from './obsremote.js';
import { pageQuery, host, onceOnly, sceneReady } from './source.js';

const q = pageQuery(), $ = (id) => document.getElementById(id), SHOT = q.has('shot'), PLAIN = q.get('ui') === '0' || SHOT;
let filmId = FILMS[q.get('film')] ? q.get('film') : 'fire-bringer', film = FILMS[filmId]; const video = $('film'), base = new Audio(), line = new Audio(); base.preload = line.preload = 'auto';
const store = { get: (k) => { try { return localStorage.getItem('hero-' + k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem('hero-' + k, v); } catch { /* private window */ } } };
let name = showName(q.get('name') ?? store.get('name') ?? ''), playing = false, lineStarted = false, failed = '';

// ---------- the picture is always 16:9, as large as fits above the controls
const frame = $('frame'), area = $('area'), fit = () => { const W = area.clientWidth, H = area.clientHeight, k = Math.min(W / 16, H / 9), w = Math.floor(16 * k), h = Math.floor(9 * k); frame.style.width = `${w}px`; frame.style.height = `${h}px`; frame.style.left = `${Math.round((W - w) / 2)}px`; frame.style.top = `${Math.round((H - h) / 2)}px`; const sp = document.getElementById('sparks'); sp.width = w; sp.height = h; };
let hidden = PLAIN; const showUi = () => { $('ui').classList.toggle('gone', hidden); document.body.classList.toggle('bare', hidden); fit(); }; showUi(); new ResizeObserver(fit).observe(area);

// ---------- the lettering of the name: ?font=Cinzel Decorative&weight=700 tries another
if (q.get('font')) { document.documentElement.style.setProperty('--title', `'${q.get('font').replace(/[^\w ]/g, '')}'`); document.documentElement.style.setProperty('--tw', String(Number(q.get('weight')) || 700)); }

// ---------- a laurel wreath: two sprays of leaves
{ const svg = $('laurel'), NS = 'http://www.w3.org/2000/svg'; for (const s of [-1, 1]) for (let i = 0; i < 11; i++) { const a = (0.35 + i * 0.215) * s, r = 78, x = 100 + Math.sin(a) * r, y = 104 + Math.cos(a) * r * 0.98, leaf = document.createElementNS(NS, 'path'), rot = -a * 57.3 + s * 62;
    leaf.setAttribute('d', 'M0 0 C6 -9 6 -21 0 -30 C-6 -21 -6 -9 0 0 Z'); leaf.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`); leaf.setAttribute('fill', 'rgba(233,194,117,.16)'); svg.append(leaf); } }

// ---------- the name
// each letter is its own piece, so that each can be moved by itself
function letters(el, text) { el.textContent = ''; const out = []; for (const ch of text) { const sp = document.createElement('span'); if (ch === ' ') sp.className = 'sp'; else { sp.className = 'l'; sp.dataset.c = ch; sp.textContent = ch; out.push(sp); } el.append(sp); } return out; }
let forgeLs = [], cardLs = [];
function setName(n) { name = showName(n); const shown = (name || 'OUR HERO').toUpperCase(); forgeLs = letters($('forgeName'), shown); cardLs = letters($('cardName'), shown); $('stoneName').textContent = shown; $('cardTitle').textContent = $('forgeTitle').textContent = film.honour.toUpperCase();
  // a long name is set smaller so that it always fits the picture
  const k = Math.min(1, 13 / Math.max(13, shown.length)); $('forge').style.fontSize = `${(11 * k).toFixed(2)}cqh`; $('cardName').style.fontSize = `${(8.4 * k).toFixed(2)}cqh`; $('stone').querySelector('.n').style.fontSize = `${(5.2 * Math.min(1, 18 / Math.max(18, shown.length))).toFixed(2)}cqh`;
  // the narrator saying this name, if a recording of it has been made; otherwise the line without a name
  line.src = film.nameLine.generic; if (name) { const named = `${film.nameLine.named}${slug(name)}.mp3`; fetch(named, { method: 'HEAD' }).then((r) => { if (r.ok && (r.headers.get('content-type') || '').includes('audio')) line.src = named; }).catch(() => {}); } }
// which film: the library is herofilms.js. Changing film changes the footage, the sound and the honour under the name.
function setFilm(id) { if (!FILMS[id]) return; filmId = id; film = FILMS[id]; video.src = film.video; base.src = film.sound; $('forge').style.top = `${film.forgeTop ?? 30}cqh`; setName(name); if (!PLAIN) $('filmSel').value = id; }
// The hero's picture, for the end card (ZW-047). Any picture is cut to a square from its middle and made small, so that it can be sent
// to the page in OBS along with the name. With no picture the end card is the laurel and the name alone.
let pic = '';
function setPic(src) { pic = src || ''; $('card').classList.toggle('pic', !!pic); $('cardPic').src = pic || 'data:,'; if (!PLAIN) { $('picOff').style.display = pic ? '' : 'none'; $('picBtn').textContent = pic ? 'Change picture' : 'Add picture'; } }
function takePicture(file) { if (!file || !file.type.startsWith('image/')) return; const img = new Image(), url = URL.createObjectURL(file); img.onload = () => { const S = 360, c = document.createElement('canvas'), k = Math.min(img.width, img.height); c.width = c.height = S;
    c.getContext('2d').drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, S, S); URL.revokeObjectURL(url); setPic(c.toDataURL('image/jpeg', 0.86)); }; img.onerror = () => URL.revokeObjectURL(url); img.src = url; }
video.src = film.video; base.src = film.sound; video.muted = true; setName(name); setPic(q.get('pic') || ''); $('forge').style.top = `${film.forgeTop ?? 30}cqh`;
if (!PLAIN) { const sel = $('filmSel'); for (const [id, f] of Object.entries(FILMS)) { const o = document.createElement('option'); o.value = id; o.textContent = f.title; sel.append(o); } sel.value = filmId; sel.addEventListener('change', () => { stop(); setFilm(sel.value); });
  $('picBtn').addEventListener('click', () => $('picFile').click()); $('picFile').addEventListener('change', () => { takePicture($('picFile').files[0]); $('picFile').value = ''; }); $('picOff').addEventListener('click', () => setPic(''));
  addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/')); if (f) { e.preventDefault(); takePicture(f); } });
  addEventListener('dragover', (e) => e.preventDefault()); addEventListener('drop', (e) => { e.preventDefault(); takePicture(e.dataTransfer?.files?.[0]); }); } if (!PLAIN) { $('name').value = name; $('name').addEventListener('input', () => { setName($('name').value); store.set('name', name); }); }

// ---------- what is drawn at each moment of the film
const ease = (x) => x * x * (3 - 2 * x), clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), out3 = (p) => 1 - (1 - p) ** 3;
// The name as a film title. u is seconds since it began, R how long the forging takes, exit 0 to 1 as it leaves.
// The letters come from the middle outward: each arrives large, blurred and white-hot and settles into gold while the spacing closes;
// then a streak of light crosses the gold, and the whole title keeps drifting slowly wider and closer, as film titles do.
function forged(box, ls, u, R, exit = 0) { const n = ls.length, c = (n - 1) / 2, x = u / R, sweep = Math.max(clamp((u - R * 1.05) / 1.3), 0) , again = clamp((u - R * 1.05 - 3.6) / 1.3), g = (again > 0 && again < 1 ? again : sweep) * 1.5 - 0.25;
  for (let i = 0; i < n; i++) { const st = ls[i].style, d = c ? Math.abs(i - c) / c : 0, p = clamp((x - 0.5 * d) / 0.5), e = out3(p), b = (g - (i + 0.5) / n) * n + 0.5;
    st.opacity = (Math.min(1, p * 2.5) * (1 - exit) ** 2).toFixed(3); st.transform = `translateY(${((1 - e) * 0.16).toFixed(3)}em) scale(${(1.6 - 0.6 * e + exit * 0.12).toFixed(3)})`;
    st.filter = e > 0.999 && !exit ? 'none' : `blur(${((1 - e) * 0.1 + exit * 0.14).toFixed(3)}em) brightness(${(1 + (1 - e) * 2.6 + exit * 1.6).toFixed(2)})`; st.setProperty('--gx', `${(clamp((2 - b) / 3, -0.2, 1.2) * 100).toFixed(1)}%`); }
  const sp = 0.36 - 0.22 * out3(clamp(x)) + 0.0035 * Math.max(0, u - R) + exit * 0.12; box.style.letterSpacing = `${sp.toFixed(4)}em`; box.style.marginRight = `${(-sp).toFixed(4)}em`; box.style.transform = `scale(${(1 + 0.007 * Math.max(0, u)).toFixed(4)})`; }
// embers rising through the name. Every ember's path is fixed by its number, so a still at a given second is always the same.
const sparks = $('sparks'), sctx = sparks.getContext('2d'), hash = (k, j) => { const v = Math.sin(k * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
function embers(t, since, level, cy, spread) { const W = sparks.width, H = sparks.height; if (level <= 0.002 || since < 0) return;
  sctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 90; k++) { const per = 2.2 + hash(k, 1) * 2.4, ph = (since / per + hash(k, 2)) % 1; if (since < hash(k, 2) * 0.9) continue;
    const x = W * (0.5 + (hash(k, 3) - 0.5) * spread + 0.018 * Math.sin(ph * 7 + k)), y = H * (cy + 0.06 - ph * (0.2 + 0.34 * hash(k, 4))), a = Math.sin(Math.PI * ph) ** 1.5 * level * (0.45 + 0.55 * hash(k, 5)), r = H * (0.0022 + 0.004 * hash(k, 6)) * (1 - 0.5 * ph);
    const gr = sctx.createRadialGradient(x, y, 0, x, y, r * 4); gr.addColorStop(0, `rgba(255,236,190,${a.toFixed(3)})`); gr.addColorStop(0.25, `rgba(255,170,60,${(a * 0.7).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,90,10,0)'); sctx.fillStyle = gr; sctx.beginPath(); sctx.arc(x, y, r * 4, 0, 6.3); sctx.fill(); } }
function draw(t) { const em = film.ember || [-9, -8], e = span(t, [em[0], em[0] + 0.6, em[1] - 1.2, em[1]]), u = (t - em[0]) / (em[1] - em[0]);
  $('ember').style.opacity = String(e * (0.75 + 0.25 * Math.sin(t * 23))); $('ember').style.transform = `translate(${(12 + 70 * u).toFixed(2)}cqw, ${(52 - 9 * Math.sin(u * 3.1) + 2 * Math.sin(u * 17)).toFixed(2)}cqh) scale(${(1 - 0.5 * Math.max(0, u - 0.7) / 0.3).toFixed(3)})`;
  // the heroic moment
  const f = film.forge, R = f[1] - f[0], fu = t - f[0], exit = clamp((t - f[2]) / (f[3] - f[2])), on = t >= f[0] - 0.3 && t < f[3], forge = $('forge'); forge.style.opacity = on ? '1' : '0';
  if (on) { forged($('forgeName'), forgeLs, fu, R, ease(exit)); const fl = forge.firstElementChild, k = (fu + 0.3) / 0.5; fl.style.opacity = (fu < -0.3 ? 0 : Math.exp(-(((fu - 0.1) / 0.45) ** 2)) * 1).toFixed(3); fl.style.transform = `scaleX(${clamp(0.05 + k * 0.6, 0, 1.3).toFixed(3)})`;
    forge.querySelector('.under').style.setProperty('--r', (ease(clamp((fu - R * 0.9) / 0.9)) * (1 - exit)).toFixed(3)); forge.style.backgroundSize = `${(100 * (1 - exit)).toFixed(1)}% 100%`; }
  const card = ease(span(t, film.card)), dim = on ? 0.2 * clamp((fu + 0.3) / 0.6) * (1 - exit) : 0;
  $('shade').style.opacity = String(Math.max(film.fadeIn && t < film.fadeIn[1] ? 1 - clamp((t - film.fadeIn[0]) / (film.fadeIn[1] - film.fadeIn[0])) : 0, card * 0.92, dim));
  $('stone').style.opacity = String(film.stone ? ease(span(t, film.stone)) : 0); $('card').style.opacity = String(card);
  // the end card: the same lettering, arriving the same way but slower, under the laurel
  const cu = t - film.card[0] - 0.4; forged($('cardName'), cardLs, cu, 1.8); $('crest').style.transform = `scale(${(0.86 + 0.14 * out3(clamp((t - film.card[0]) / 2))).toFixed(3)})`; $('cardTitle').style.opacity = ease(clamp((cu - 1.5) / 1)).toFixed(3);
  sctx.clearRect(0, 0, sparks.width, sparks.height); embers(t, fu - 0.2, on ? (1 - exit) * clamp((fu + 0.2) / 0.8) : 0, 0.46, 0.62); embers(t, cu, card, 0.56, 0.5);
  const c = film.captions.find((x) => t >= x[0] && t <= x[1]), cap = $('caption'); cap.classList.toggle('on', !!c); if (c) cap.textContent = c[2].replace('[NAME]', name || 'One of us'); }

// ---------- playing. The footage is the clock; the sound is kept in step with it.
// quiet: the picture without the sound. The control room plays along like that when the film is sent to OBS, so that the sound is not heard twice (ZW-059).
// If the browser refuses to start a film with sound (no click yet), it is started again without sound: a silent film is better than a black screen.
function play(quiet = false) { failed = ''; lineStarted = false; video.muted = true; base.muted = line.muted = quiet === true; video.currentTime = 0; base.currentTime = 0; line.pause(); line.currentTime = 0; playing = true;
  Promise.all([video.play(), base.play()]).catch((e) => { if (quiet !== true) { play(true); failed = 'playing without sound: ' + e.message; } else { failed = 'could not start: ' + e.message; playing = false; } }); }
function stop() { playing = false; video.pause(); base.pause(); line.pause(); video.currentTime = 0; draw(0); }
function tick() { const t = video.currentTime; if (playing) { if (Math.abs(base.currentTime - t) > 0.25) base.currentTime = t;
    if (!lineStarted && t >= film.nameLine.at) { lineStarted = true; line.currentTime = 0; line.play().catch(() => {}); } if (video.ended || t >= film.length) { playing = false; base.pause(); } draw(t); }
  if (!PLAIN) $('status').textContent = failed || (playing ? `${film.title} · ${Math.floor(t)}s of ${film.length}` : `${film.title} · ready`); requestAnimationFrame(tick); }
if (!PLAIN) { $('play').addEventListener('click', play); $('stop').addEventListener('click', stop); const caps = () => { const on = document.body.classList.toggle('captions'); $('caps').textContent = `Words on screen: ${on ? 'on' : 'off'}`; $('caps').classList.toggle('on', on); store.set('captions', on ? '1' : '0'); }; $('caps').addEventListener('click', caps); if (store.get('captions') === '1') caps(); }
if (q.has('captions')) document.body.classList.add('captions');
addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; if (e.code === 'Space') { e.preventDefault(); playing ? stop() : play(); } else if (e.key.toLowerCase() === 'h' && q.get('ui') !== '0') { hidden = !hidden; showUi(); } });
if (q.get('ui') === '0') { addEventListener('pointerdown', () => { if (!playing) play(); }); if (q.has('autoplay')) play(); } else if (q.has('autoplay')) play();
// As a source with autoplay (ZW-050): hidden, the film stops and goes back to its start; shown again, it plays from the start.
// OBS tells a browser source when it is shown and hidden (obsSourceVisibleChanged); a plain browser tab says it by visibilitychange.
if (q.get('ui') === '0' && q.has('autoplay')) { let shown = true; const seen = (v) => { if (v === shown) return; shown = v; if (v) play(); else stop(); };
  addEventListener('obsSourceVisibleChanged', (e) => seen(!!e.detail?.visible)); document.addEventListener('visibilitychange', () => seen(!document.hidden)); }
// ---------- the remote (ZW-048). A page that runs without controls, as a browser source in OBS, does what it is told:
// by OBS itself (an event that OBS hands to every browser source) or by another tab of the same browser.
const chan = 'BroadcastChannel' in window ? new BroadcastChannel('zeus-hero') : null;
const obey = (m) => { if (!m || typeof m !== 'object') return; if (m.cmd === 'play') { if (m.film && m.film !== filmId) setFilm(m.film); if ('pic' in m) setPic(m.pic); if (m.name != null) { setName(m.name); if (!PLAIN) $('name').value = name; } play(); } else if (m.cmd === 'stop') stop(); };
const fresh = onceOnly(); addEventListener('zeusHero', (e) => { if (fresh(e.detail)) obey(e.detail); }); if (chan && q.get('ui') === '0') chan.onmessage = (e) => obey(e.data); sceneReady('hero');
// The page with controls is the remote. It reaches OBS on this computer through OBS's own remote control, tells the source to play,
// and if OBS cannot pass that on, points the source at an address with the name in it, which makes it load again and play.
if (!PLAIN) { let obs = null, src = null; const say = (t) => { $('obsStatus').textContent = t; }; $('obsPass').value = store.get('obspass') || '';
  const connect = async () => { say('connecting'); try { obs = await connectObs({ password: $('obsPass').value, port: Number(q.get('obsport')) || 4455, onClose: () => { obs = null; say('connection to OBS closed'); } }); store.set('obspass', $('obsPass').value);
      src = await obs.findBrowserSource('hero.html').catch(() => null); say(src ? `connected · source "${src.name}"` : 'connected, but OBS has no browser source with hero.html in its address'); } catch (e) { obs = null; say(e.message); } };
  const send = async (m) => { chan?.postMessage(m); if (host) { try { await host.emit('zeusHero', m); if (m.cmd === 'play') { play(true); say(`playing in OBS for ${m.name || 'our hero'} · shown here without sound`); } else { stop(); say('stopped in OBS'); } } catch (e) { say(e.message); } return; } if (!obs) { say('not connected to OBS'); return; }
    try { await obs.emit('zeusHero', m); say(m.cmd === 'play' ? `playing in OBS for ${m.name || 'our hero'}` : 'stopped in OBS'); }
    catch (e) { if (m.cmd === 'play' && src) { try { const u = new URL(src.url); u.searchParams.set('name', m.name || ''); u.searchParams.set('film', m.film || filmId); u.searchParams.delete('pic'); u.searchParams.set('ui', '0'); u.searchParams.set('autoplay', '1'); u.searchParams.set('n', String(Date.now())); await obs.setUrl(src.name, u.toString()); say(`playing in OBS for ${m.name || 'our hero'} (the source was loaded again)`); } catch (e2) { say(e2.message); } } else say(e.message); } };
  // the address of this film with this name, for a browser source: controls off, starting by itself (ZW-050). The picture cannot travel in an address.
  const sourceLink = () => { const u = new URL(location.pathname, location.origin); u.searchParams.set('film', filmId); u.searchParams.set('name', name); u.searchParams.set('ui', '0'); u.searchParams.set('autoplay', '1'); if (document.body.classList.contains('captions')) u.searchParams.set('captions', '1'); return u.toString(); }; window.__hero_link = sourceLink;
  $('copyLink').addEventListener('click', async () => { const link = sourceLink(), b = $('copyLink'); try { await navigator.clipboard.writeText(link); b.textContent = 'Copied'; } catch { prompt('Copy this link into the browser source:', link); } setTimeout(() => { b.textContent = 'Copy link for OBS'; }, 1600); });
  $('obsConnect').addEventListener('click', connect); $('sendPlay').addEventListener('click', () => send({ cmd: 'play', name, film: filmId, pic })); $('sendStop').addEventListener('click', () => send({ cmd: 'stop' })); if (host) { $('obsPass').parentElement.style.display = $('obsConnect').style.display = $('copyLink').style.display = 'none'; say('OBS is connected from the bar at the top'); } else if (store.get('obspass') != null && q.get('obs') !== '0') connect(); }
// the door for the stage or for TikFinity later: window.playHeroFilm('Andie Howard')
window.playHeroFilm = (n) => { if (n != null) setName(n); play(); }; window.__hero = { get film() { return film; }, get pic() { return pic; }, video, base, line, draw, get name() { return name; }, get playing() { return playing; } };
const fonts = document.fonts ? Promise.all([document.fonts.load('800 80px Cinzel'), document.fonts.load(`${Number(q.get('weight')) || 700} 80px '${(q.get('font') || 'Cinzel').replace(/[^\w ]/g, '')}'`), document.fonts.load("italic 500 20px 'Cormorant Garamond'"), document.fonts.load('500 20px Cinzel'), document.fonts.load('700 80px Cinzel'), document.fonts.load('600 40px Cinzel'), document.fonts.load('400 20px Cinzel')]).catch(() => {}) : Promise.resolve();
if (SHOT) { const t = Number(q.get('t') || 0); fonts.then(() => new Promise((done) => { const go = () => { video.addEventListener('seeked', () => setTimeout(done, 150), { once: true }); video.currentTime = Math.min(t, (video.duration || 60) - 0.05); }; if (video.readyState >= 1) go(); else video.addEventListener('loadedmetadata', go, { once: true }); setTimeout(done, 15000); })).then(() => { draw(t); requestAnimationFrame(() => { window.ready = true; }); }); }
else { draw(0); fonts.then(() => { window.ready = true; }); requestAnimationFrame(tick); }
