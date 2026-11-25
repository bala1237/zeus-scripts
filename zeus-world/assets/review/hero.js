// Plays a hero film (ZW-047) and draws the hero's name into it. herofilms.js is the library; this is the player.
//   ?film=fire-bringer   ?name=Andie Howard   ?ui=0 (no controls; plays when the page is clicked or, if the browser allows, at once)
//   ?autoplay   ?captions   ?shot&t=34 (one still at that second, for checking)
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import { FILMS, showName, slug, span } from './herofilms.js';

const q = new URLSearchParams(location.search), $ = (id) => document.getElementById(id), SHOT = q.has('shot'), PLAIN = q.get('ui') === '0' || SHOT;
const film = FILMS[q.get('film')] || FILMS['fire-bringer'], video = $('film'), base = new Audio(), line = new Audio(); base.preload = line.preload = 'auto';
const store = { get: (k) => { try { return localStorage.getItem('hero-' + k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem('hero-' + k, v); } catch { /* private window */ } } };
let name = showName(q.get('name') ?? store.get('name') ?? ''), playing = false, lineStarted = false, failed = '';

// ---------- the picture is always 16:9, as large as fits above the controls
const frame = $('frame'), area = $('area'), fit = () => { const W = area.clientWidth, H = area.clientHeight, k = Math.min(W / 16, H / 9), w = Math.floor(16 * k), h = Math.floor(9 * k); frame.style.width = `${w}px`; frame.style.height = `${h}px`; frame.style.left = `${Math.round((W - w) / 2)}px`; frame.style.top = `${Math.round((H - h) / 2)}px`; };
let hidden = PLAIN; const showUi = () => { $('ui').classList.toggle('gone', hidden); fit(); }; showUi(); new ResizeObserver(fit).observe(area);

// ---------- a laurel wreath: two sprays of leaves
{ const svg = $('laurel'), NS = 'http://www.w3.org/2000/svg'; for (const s of [-1, 1]) for (let i = 0; i < 11; i++) { const a = (0.35 + i * 0.215) * s, r = 78, x = 100 + Math.sin(a) * r, y = 104 + Math.cos(a) * r * 0.98, leaf = document.createElementNS(NS, 'path'), rot = -a * 57.3 + s * 62;
    leaf.setAttribute('d', 'M0 0 C6 -9 6 -21 0 -30 C-6 -21 -6 -9 0 0 Z'); leaf.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`); leaf.setAttribute('fill', 'rgba(233,194,117,.16)'); svg.append(leaf); } }

// ---------- the name
function setName(n) { name = showName(n); const shown = name || 'OUR HERO'; $('forgeName').textContent = shown.toUpperCase(); $('stoneName').textContent = shown.toUpperCase(); $('cardName').textContent = shown.toUpperCase(); $('cardTitle').textContent = film.honour.toUpperCase();
  // a long name is set smaller so that it always fits the picture
  const k = Math.min(1, 13 / Math.max(13, shown.length)); $('forge').style.fontSize = `${(11 * k).toFixed(2)}cqh`; $('cardName').style.fontSize = `${(8.4 * k).toFixed(2)}cqh`; $('stone').querySelector('.n').style.fontSize = `${(5.2 * Math.min(1, 18 / Math.max(18, shown.length))).toFixed(2)}cqh`;
  // the narrator saying this name, if a recording of it has been made; otherwise the line without a name
  line.src = film.nameLine.generic; if (name) { const named = `${film.nameLine.named}${slug(name)}.mp3`; fetch(named, { method: 'HEAD' }).then((r) => { if (r.ok && (r.headers.get('content-type') || '').includes('audio')) line.src = named; }).catch(() => {}); } }
video.src = film.video; base.src = film.sound; video.muted = true; setName(name); if (!PLAIN) { $('name').value = name; $('name').addEventListener('input', () => { setName($('name').value); store.set('name', name); }); }

// ---------- what is drawn at each moment of the film
const ease = (x) => x * x * (3 - 2 * x);
function draw(t) { const e = span(t, [film.ember[0], film.ember[0] + 0.6, film.ember[1] - 1.2, film.ember[1]]), u = (t - film.ember[0]) / (film.ember[1] - film.ember[0]);
  $('ember').style.opacity = String(e * (0.75 + 0.25 * Math.sin(t * 23))); $('ember').style.transform = `translate(${(12 + 70 * u).toFixed(2)}cqw, ${(52 - 9 * Math.sin(u * 3.1) + 2 * Math.sin(u * 17)).toFixed(2)}cqh) scale(${(1 - 0.5 * Math.max(0, u - 0.7) / 0.3).toFixed(3)})`;
  $('shade').style.opacity = String(t < film.fadeIn[0] ? 1 : t < film.fadeIn[1] ? 1 - (t - film.fadeIn[0]) / (film.fadeIn[1] - film.fadeIn[0]) : span(t, [film.card[0] - 0.2, film.card[1]]) * 0.92);
  const f = film.forge; $('forge').style.opacity = String(t < f[0] ? 0 : t < f[2] ? 1 : Math.max(0, 1 - (t - f[2]) / (f[3] - f[2]))); $('forgeName').style.setProperty('--w', (100 * ease(Math.min(1, Math.max(0, (t - f[0]) / (f[1] - f[0])))) - 2).toFixed(1));
  $('stone').style.opacity = String(ease(span(t, film.stone))); $('card').style.opacity = String(ease(span(t, film.card)));
  const c = film.captions.find((x) => t >= x[0] && t <= x[1]), cap = $('caption'); cap.classList.toggle('on', !!c); if (c) cap.textContent = c[2].replace('[NAME]', name || 'One of us'); }

// ---------- playing. The footage is the clock; the sound is kept in step with it.
function play() { failed = ''; lineStarted = false; video.currentTime = 0; base.currentTime = 0; line.pause(); line.currentTime = 0; playing = true; Promise.all([video.play(), base.play()]).catch((e) => { failed = 'could not start: ' + e.message; playing = false; }); }
function stop() { playing = false; video.pause(); base.pause(); line.pause(); video.currentTime = 0; draw(0); }
function tick() { const t = video.currentTime; if (playing) { if (Math.abs(base.currentTime - t) > 0.25) base.currentTime = t;
    if (!lineStarted && t >= film.nameLine.at) { lineStarted = true; line.currentTime = 0; line.play().catch(() => {}); } if (video.ended || t >= film.length) { playing = false; base.pause(); } draw(t); }
  if (!PLAIN) $('status').textContent = failed || (playing ? `${film.title} · ${Math.floor(t)}s of ${film.length}` : `${film.title} · ready`); requestAnimationFrame(tick); }
if (!PLAIN) { $('play').addEventListener('click', play); $('stop').addEventListener('click', stop); const caps = () => { const on = document.body.classList.toggle('captions'); $('caps').textContent = `Words on screen: ${on ? 'on' : 'off'}`; $('caps').classList.toggle('on', on); store.set('captions', on ? '1' : '0'); }; $('caps').addEventListener('click', caps); if (store.get('captions') === '1') caps(); }
if (q.has('captions')) document.body.classList.add('captions');
addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; if (e.code === 'Space') { e.preventDefault(); playing ? stop() : play(); } else if (e.key.toLowerCase() === 'h' && q.get('ui') !== '0') { hidden = !hidden; showUi(); } });
if (q.get('ui') === '0') { addEventListener('pointerdown', () => { if (!playing) play(); }); if (q.has('autoplay')) play(); } else if (q.has('autoplay')) play();
// the door for the stage or for TikFinity later: window.playHeroFilm('Andie Howard')
window.playHeroFilm = (n) => { if (n != null) setName(n); play(); }; window.__hero = { film, video, base, line, draw, get name() { return name; }, get playing() { return playing; } };
const fonts = document.fonts ? Promise.all([document.fonts.load('700 80px Cinzel'), document.fonts.load('600 40px Cinzel'), document.fonts.load('400 20px Cinzel')]).catch(() => {}) : Promise.resolve();
if (SHOT) { const t = Number(q.get('t') || 0); fonts.then(() => new Promise((done) => { const go = () => { video.addEventListener('seeked', () => setTimeout(done, 150), { once: true }); video.currentTime = Math.min(t, (video.duration || 60) - 0.05); }; if (video.readyState >= 1) go(); else video.addEventListener('loadedmetadata', go, { once: true }); setTimeout(done, 15000); })).then(() => { draw(t); requestAnimationFrame(() => { window.ready = true; }); }); }
else { draw(0); fonts.then(() => { window.ready = true; }); requestAnimationFrame(tick); }
