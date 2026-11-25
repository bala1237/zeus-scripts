// Talks to OBS from a page, through the remote control that OBS has built in (Tools > WebSocket Server Settings; protocol 5).
// Used to tell a page that runs inside OBS as a browser source what to do, from a page open in an ordinary browser (ZW-048).
//   const obs = await connectObs({ port: 4455, password: '…' });
//   await obs.emit('zeusHero', { cmd: 'play', name: 'Andie Howard' });   every browser source in OBS gets a window event of that name
//   const src = await obs.findBrowserSource('hero.html');  await obs.setUrl(src.name, newUrl);   the slower way: point the source at a new address
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))), sha = async (text) => b64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));

export function connectObs({ port = 4455, password = '', host = '127.0.0.1', onClose = () => {} } = {}) {
  return new Promise((resolve, reject) => { let ws, n = 0, done = false; const waiting = new Map();
    try { ws = new WebSocket(`ws://${host}:${port}`); } catch (e) { reject(e); return; }
    const fail = (why) => { if (!done) { done = true; reject(new Error(why)); } try { ws.close(); } catch { /* already closed */ } };
    const request = (requestType, requestData = {}) => new Promise((res, rej) => { const requestId = `z${++n}`; waiting.set(requestId, { res, rej }); ws.send(JSON.stringify({ op: 6, d: { requestType, requestId, requestData } })); setTimeout(() => { if (waiting.delete(requestId)) rej(new Error('OBS did not answer')); }, 4000); });
    const api = { request, close: () => ws.close(),
      // an event in every browser source: window.addEventListener(name, (e) => e.detail)
      emit: (name, data) => request('CallVendorRequest', { vendorName: 'obs-browser', requestType: 'emit_event', requestData: { event_name: name, event_data: data } }),
      async findBrowserSource(part) { const { inputs } = await request('GetInputList', { inputKind: 'browser_source' }); for (const i of inputs) { const { inputSettings } = await request('GetInputSettings', { inputName: i.inputName }); if ((inputSettings.url || '').includes(part)) return { name: i.inputName, url: inputSettings.url }; } return null; },
      setUrl: (inputName, url) => request('SetInputSettings', { inputName, inputSettings: { url }, overlay: true }) };
    ws.onerror = () => fail('could not reach OBS: is it open, and is its WebSocket server switched on?');
    ws.onclose = (e) => { for (const w of waiting.values()) w.rej(new Error('OBS closed the connection')); waiting.clear(); if (!done) fail(e.code === 4009 ? 'OBS refused the password' : 'OBS closed the connection'); else onClose(); };
    ws.onmessage = async (m) => { const { op, d } = JSON.parse(m.data);
      if (op === 0) { const id = { rpcVersion: 1, eventSubscriptions: 0 }; if (d.authentication) { if (!password) { fail('OBS wants a password'); return; } id.authentication = await sha(await sha(password + d.authentication.salt) + d.authentication.challenge); } ws.send(JSON.stringify({ op: 1, d: id })); }
      else if (op === 2) { done = true; resolve(api); }
      else if (op === 7) { const w = waiting.get(d.requestId); if (!w) return; waiting.delete(d.requestId); if (d.requestStatus.result) w.res(d.responseData || {}); else w.rej(new Error(d.requestStatus.comment || `OBS said no (${d.requestStatus.code})`)); } }; });
}
