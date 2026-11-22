// Animated captions: each letter rises, sharpens and settles; gold words shimmer.
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

export function makeCaptions(host, captions) {
  return captions.map((c) => {
    const box = document.createElement('div'); box.className = 'cap'; box.style.top = c.top + 'px';
    const letters = []; let n = 0;
    c.lines.forEach((line) => {
      const row = document.createElement('div'); row.className = 'row'; row.style.fontSize = line.size + 'px'; if (line.track) row.style.letterSpacing = line.track + 'em';
      line.text.split(/(\{[^}]*\})/).forEach((chunk) => {
        const gold = chunk.startsWith('{'); const text = gold ? chunk.slice(1, -1) : chunk;
        text.split(/(\s+)/).forEach((word) => {
          if (!word) return; if (/^\s+$/.test(word)) { row.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'word';
          [...word].forEach((ch) => { const s = document.createElement('span'); s.className = 'ch' + (gold || line.gold ? ' gold' : ''); s.textContent = ch; w.appendChild(s); letters.push({ s, i: n++, gold: gold || line.gold }); });
          row.appendChild(w);
        });
      });
      box.appendChild(row); if (line.delay) letters.slice(-[...line.text.replace(/[{}\s]/g, '')].length).forEach((l) => (l.extra = line.delay));
    });
    const rule = document.createElement('div'); rule.className = 'rule'; box.appendChild(rule); host.appendChild(box);
    return { c, box, letters, rule };
  });
}

export function updateCaptions(caps, t) {
  for (const { c, box, letters, rule } of caps) {
    const out = 1 - ease((t - (c.out - 0.3)) / 0.3); const live = t > c.in - 0.05 && t < c.out;
    box.style.display = live ? 'block' : 'none'; if (!live) continue;
    box.style.opacity = out; box.style.transform = `translateY(${(1 - out) * -18}px) scale(${1 + 0.03 * Math.min(1, (t - c.in) / (c.out - c.in))})`;
    const step = c.snap ? 0.018 : 0.028;
    for (const l of letters) {
      const k = ease((t - c.in - (l.extra || 0) - l.i * step) / (c.snap ? 0.22 : 0.42));
      l.s.style.opacity = k; l.s.style.transform = `translateY(${(1 - k) * 46}px) scale(${c.snap ? 1.6 - 0.6 * k : 0.86 + 0.14 * k})`; l.s.style.filter = k < 0.999 ? `blur(${(1 - k) * 9}px)` : 'none';
      if (l.gold) l.s.style.backgroundPosition = `${130 - ((t - c.in) * 55 + l.i * 6) % 260}% 0`;
    }
    rule.style.width = ease((t - c.in - 0.25) / 0.7) * 300 + 'px'; rule.style.opacity = c.rule === false ? 0 : 1;
  }
}
