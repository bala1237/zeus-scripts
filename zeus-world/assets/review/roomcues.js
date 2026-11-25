// Room cues for Andie's Place (ZW-042): which of the room's own lights are on at each moment. No drawing happens here.
// The room has six neon pieces, counted from the left: 0 the words top left, 1 the sign bottom left, 2 the gold name sign,
// 3 the welcome panel, 4 the words top right, 5 the words bottom right.
//   roomCue(pattern, beats, out)  fills out[0..5] with each piece's light (0 or 1) and out[6] with the room's own light
//   (the wall, shelves and furniture: 1 is the lit room, 0 is black).
//   glow     everything on: the room as it normally looks
//   chase    one piece lit, stepping left to right and back every half beat, the rest of the room black
//   oracle   short flashes with black between: the whole room, the middle alone, the two sides alone, a matching pair, one piece alone
//   fill     pieces come on one after another from the left until all are lit, go out again, then the same from the right
//   strobe   the whole room blinks, twice a beat. Not faster: rapid full-picture flashing is a risk for photosensitive viewers
export const ROOM_CUES = ['glow', 'chase', 'oracle', 'fill', 'strobe'], PIECES = 6;
// A all, C the middle, S both sides, T the top pair, B the bottom pair, L and R one side's top, W the welcome panel, N the name, - black. One letter per half beat.
const SCRIPT = 'A-CS-C-A' + 'T-B-TC--' + 'SCSC-A--' + 'L-R-LRA-' + 'N--W--N-' + 'B-T-W-A-' + 'CSCSTBTB' + 'A---A-C-';
export function roomCue(pattern, beats, out = []) { const n = PIECES; for (let i = 0; i <= n; i++) out[i] = 0; const fr = (x) => x - Math.floor(x), half = Math.floor(beats * 2), on = (...ids) => { for (const i of ids) out[i] = 1; };
  if (pattern === 'glow') { on(0, 1, 2, 3, 4, 5); out[n] = 1; }
  else if (pattern === 'chase') { const s = half % (2 * n - 2); out[s < n ? s : 2 * n - 2 - s] = 1; }
  else if (pattern === 'oracle') { const c = SCRIPT[half % SCRIPT.length]; if (c === '-' || fr(beats * 2) > 0.5) return out;
    if (c === 'A') { on(0, 1, 2, 3, 4, 5); out[n] = 0.6; } else if (c === 'C') on(2, 3); else if (c === 'S') on(0, 1, 4, 5); else if (c === 'T') on(0, 4); else if (c === 'B') on(1, 5); else if (c === 'L') on(0); else if (c === 'R') on(4); else if (c === 'W') on(3); else on(2); }
  else if (pattern === 'fill') { const s = half % (4 * n), h = s % (2 * n), lit = h < n ? h + 1 : 2 * n - 1 - h, fromRight = s >= 2 * n; for (let i = 0; i < lit; i++) out[fromRight ? n - 1 - i : i] = 1; if (lit === n) out[n] = 0.6; }
  else if (pattern === 'strobe') { if (fr(beats * 2) < 0.4) { on(0, 1, 2, 3, 4, 5); out[n] = 0.7; } }
  return out; }

// Which cue plays when: sixteen beats each, never the same twice running, the plain lit room about half the time,
// and (when lasers are allowed) a laser passage now and then with the room dimmed.
export function createRoomShow({ seed = 5 } = {}) { let a = seed; const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  const st = { cue: -1, pattern: 'glow', lasers: false, calm: false, burst: -99 };
  function update(beats, { lasersAllowed = false } = {}) { const cue = Math.floor(beats / 16);
    if (cue !== st.cue) { st.cue = cue; const was = st.pattern, wasLasers = st.lasers; st.lasers = false;
      // after anything else comes the lit room; after the lit room, four times in five, something else
      if (st.calm || was !== 'glow' || wasLasers || rnd() > 0.8) st.pattern = 'glow';
      else if (lasersAllowed && rnd() < 0.3) st.lasers = true;
      else { const from = ['chase', 'oracle', 'fill', 'strobe'].filter((p) => p !== st.last); st.pattern = from[Math.floor(rnd() * from.length)]; st.last = st.pattern; } }
    return st; }
  // a breakdown: back to the plain lit room, held; the drop: four beats of everything, with lasers if allowed
  const setCalm = (on) => { if (on !== st.calm) { st.calm = on; if (on) { st.pattern = 'glow'; st.lasers = false; } } };
  const hit = (beats) => { st.calm = false; st.burst = beats; };
  return { state: st, update, setCalm, hit };
}
