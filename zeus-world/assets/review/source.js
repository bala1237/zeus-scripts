// Is this page a picture for the stream, or a page somebody is looking at? (ZW-056, ZW-057)
// Inside OBS a page is a browser source: OBS gives every such page the object window.obsstudio. There the controls are never wanted,
// so the page behaves as if its address said ui=0, whatever the address says. ?ui=1 brings them back (to use OBS's "Interact" window).
// Other streaming software (TikTok LIVE Studio) gives no such sign: there the address still needs ui=0.
export const IN_OBS = typeof window !== 'undefined' && typeof window.obsstudio !== 'undefined';
export function pageQuery() { const q = new URLSearchParams(location.search); if (IN_OBS && q.get('ui') !== '1') q.set('ui', '0'); return q; }
// The control room this page is shown inside, if any (live.html): its one connection to OBS is used instead of the page's own.
export const host = (() => { try { return parent !== window && parent.zeusLive ? parent.zeusLive : null; } catch { return null; } })();
// A message sent from the control room carries a number (_n). If it reaches a page by two roads, it is obeyed once.
// A numbered message is also meant for the scene inside live.html only. An older source of the same scene, still in OBS by its own
// address, gets the same event from OBS; if it obeyed too, a film would play twice, a second apart, with two sounds (ZW-059).
const ALONE_IN_OBS = IN_OBS && (() => { try { return parent === window; } catch { return false; } })();
// shell: live.html itself, which is what the numbered messages are for
export function onceOnly(shell = false) { let seen = null; return (m) => { if (m && m._n != null) { if ((ALONE_IN_OBS && !shell) || m._n === seen) return false; seen = m._n; } return true; }; }
// Tell the page around this one (live.html) that this scene now listens, so that messages kept for it can be handed over.
export function sceneReady(scene) { try { if (parent !== window) parent.postMessage({ zeusReady: scene }, location.origin); } catch { /* not inside another page */ } }
