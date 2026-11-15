// Timing and words for the teaser. Retime the cuts here to match the music.
export const CUTS = {
  gate: 4.0,      // lightning flash cuts to the gate opening
  plot: 9.0,      // a citizen's own plot
  stadium: 15.0,  // the community build
  names: 19.6,    // names carved on the wall
  wide: 22.6,     // pull back over the district
  title: 26.0,    // title card
};
export const DURATION = 30;

export const HERO = 'Luna';

// Placeholder names. Replace with real citizens only with their consent.
export const NAMES = ['Luna', 'Kai', 'Mateo', 'Aisha', 'Yuki', 'Priya', 'Noah', 'Zara', 'Leo', 'Amara', 'Sofia', 'Omar', 'Mila', 'Ravi', 'Chloe', 'Diego', 'Nia', 'Arjun', 'Elena', 'Jin', 'Fatima', 'Lucas', 'Maya', 'Tariq', 'Ines'];

// top = pixels from the top of the 1080x1920 frame. TikTok's interface covers
// roughly the bottom quarter and the right edge, so captions sit high.
export const CAPTIONS = [
  { text: 'Zeus is building<br/>a world.', in: 0.35, out: 3.9, top: 300, size: 70 },
  { text: 'Your name<br/>is in it.', in: 2.0, out: 3.9, top: 500, size: 96, gold: true, snap: true },
  { text: 'Every viewer<br/>becomes a citizen.', in: CUTS.gate + 0.9, out: CUTS.plot - 0.1, top: 290, size: 66 },
  { text: 'Earn Bolts.<br/>Build your place.', in: CUTS.plot + 0.4, out: CUTS.stadium - 0.1, top: 290, size: 70 },
  { text: 'Build together<br/>what no one can alone.', in: CUTS.stadium + 0.4, out: CUTS.names - 0.1, top: 290, size: 62 },
  { text: 'Every name<br/>carved in stone.', in: CUTS.names + 0.4, out: CUTS.wide - 0.1, top: 290, size: 70 },
];
