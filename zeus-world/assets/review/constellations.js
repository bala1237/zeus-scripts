// Figures for the sky (ZW-046): each a set of lines in a square from -1 to 1, drawn as a constellation by lightning.
// Our own drawings. A figure is a list of strokes; a stroke is a list of [x, y] points. They are drawn in the order given.
const mirror = (s) => s.map(([x, y]) => [-x, y]);
function lion() { const mane = []; for (let k = 0; k <= 26; k++) { const a = Math.PI / 2 + (k / 26) * Math.PI * 2, r = k % 2 ? 0.80 : 1.0; mane.push([Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.94 - 0.02]); }
  const face = [[0, 0.56], [0.3, 0.5], [0.5, 0.64], [0.44, 0.38], [0.52, 0.05], [0.36, -0.36], [0.13, -0.6], [0, -0.64]], eye = [[0.31, 0.15], [0.12, 0.07], [0.28, 0.03], [0.31, 0.15]], brow = [[0.12, 0.07], [0.09, -0.14]], mouth = [[0, -0.38], [0.14, -0.47], [0.25, -0.38]];
  return [mane, face, mirror(face).reverse(), eye, mirror(eye), brow, mirror(brow), [[-0.1, -0.14], [0.1, -0.14], [0, -0.28], [-0.1, -0.14]], [[0, -0.28], [0, -0.38]], mouth, mirror(mouth)]; }
export const FIGURES = { lion: lion() };
// A figure made ready for drawing: its segments in order, with how far along the whole drawing each one starts and ends (0 to 1),
// and its stars (the corners, without repeats).
export function prepare(name) { const strokes = FIGURES[name]; if (!strokes) return null; const segs = [], stars = [], seen = new Set(); let total = 0;
  for (const s of strokes) for (let i = 0; i < s.length; i++) { const key = s[i][0].toFixed(2) + ',' + s[i][1].toFixed(2); if (!seen.has(key)) { seen.add(key); stars.push({ x: s[i][0], y: s[i][1], at: total }); }
    if (i < s.length - 1) { const len = Math.hypot(s[i + 1][0] - s[i][0], s[i + 1][1] - s[i][1]); segs.push({ a: s[i], b: s[i + 1], from: total, len }); total += len; } }
  for (const g of segs) { g.to = (g.from + g.len) / total; g.from /= total; } for (const st of stars) st.at /= total; return { segs, stars, total }; }
