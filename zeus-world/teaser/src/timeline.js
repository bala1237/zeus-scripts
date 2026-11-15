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
export const CAPTIONS = [
  { text: 'Zeus is building<br/>a world.', in: 0.35, out: 3.9, top: 300, size: 70 },
  { text: 'Your name<br/>is in it.', in: 2.0, out: 3.9, top: 500, size: 96, gold: true, snap: true },
  { text: 'Every viewer<br/>becomes a citizen.', in: CUTS.gate + 0.5, out: CUTS.plot - 0.1, top: 290, size: 66 },
  { text: 'Earn Bolts.<br/>Build your place.', in: CUTS.plot + 0.4, out: CUTS.stadium - 0.1, top: 290, size: 70 },
  { text: 'Build together<br/>what no one can alone.', in: CUTS.stadium + 0.4, out: CUTS.names - 0.1, top: 290, size: 62 },
  { text: 'Every name<br/>carved in stone.', in: CUTS.names + 0.4, out: CUTS.wide - 0.1, top: 290, size: 70 },
];
