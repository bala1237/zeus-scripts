// Timing and words for the teaser. Retime the cuts here to match the music.
// Cut times follow the big hits in music/mythic-dawn.mp3 (bars are ~1.98s):
// thunder at 2.0, hits at 6.0, 9.9, 17.9 and 25.8. The title lands on the
// track's final swell, which scripts/music.sh splices in.
export const CUTS = {
  gate: 4.0,      // lightning flash cuts to the gate; doors burst open on the 6.0 hit
  plot: 9.92,     // a citizen's own plot
  stadium: 15.9,  // the community build; it starts rising on the 17.9 hit
  names: 21.82,   // names carved on the wall
  wide: 25.8,     // pull back over the district
  title: 29.0,    // title card on the final swell
};
export const DURATION = 32.5;

export const HERO = 'Luna';

// Placeholder names. Replace with real citizens only with their consent.
export const NAMES = ['Luna', 'Kai', 'Mateo', 'Aisha', 'Yuki', 'Priya', 'Noah', 'Zara', 'Leo', 'Amara', 'Sofia', 'Omar', 'Mila', 'Ravi', 'Chloe', 'Diego', 'Nia', 'Arjun', 'Elena', 'Jin', 'Fatima', 'Lucas', 'Maya', 'Tariq', 'Ines'];

// top = pixels from the top of the 1080x1920 frame. TikTok's interface covers
// roughly the bottom quarter and the right edge, so captions sit high.
// Words in {braces} are set in gold.
export const CAPTIONS = [
  { in: 0.35, out: 3.9, top: 250, rule: false, lines: [{ text: 'Zeus is building', size: 74 }, { text: 'a world.', size: 74 }] },
  { in: 2.0, out: 3.9, top: 470, snap: true, rule: false, lines: [{ text: 'Your name', size: 118, gold: true }, { text: 'is in it.', size: 118, gold: true }] },
  { in: CUTS.gate + 0.5, out: CUTS.plot - 0.1, top: 230, lines: [{ text: 'Every viewer', size: 72 }, { text: 'becomes a {citizen}', size: 72 }] },
  { in: CUTS.plot + 0.4, out: CUTS.stadium - 0.1, top: 230, lines: [{ text: 'Earn {Bolts}', size: 96 }, { text: 'Build your place', size: 64, delay: 0.5 }] },
  { in: CUTS.stadium + 0.4, out: CUTS.names - 0.1, top: 230, lines: [{ text: 'Build {together}', size: 84 }, { text: 'what no one can alone', size: 50, delay: 0.5 }] },
  { in: CUTS.names + 0.4, out: CUTS.wide - 0.1, top: 210, lines: [{ text: 'Every {name}', size: 84 }, { text: 'carved in stone', size: 60, delay: 0.4 }] },
];
