// Timing and words for the teaser. Cuts land on beats of music/mythic-dawn.mp3
// (about 0.495 s per beat; big hits at 2.0, 6.0, 9.9, 17.9, 25.8 and the title swell at 29.0).
export const CUTS = {
  strike: 2.0,     // lightning strikes the valley and a villa bursts up
  comments: 4.0,   // comments float up and turn into citizens at the gate
  gate: 6.0,       // gate doors burst open on the hit
  builder: 7.95,   // the phone builder: tap, tap, tap, the villa assembles
  upgrade: 9.9,    // upgrade montage (three quick cuts)
  upgrade2: 10.65,
  upgrade3: 11.4,
  rise: 12.15,     // lightning raises the district
  featured: 13.9,  // Zeus features a citizen's build on LIVE
  together: 15.9,  // the crowd pours Bolts into the community build
  stadium: 17.9,   // the stadium erupts from the ground, fireworks
  tease1: 19.85,   // curiosity montage: what's coming
  tease2: 20.85,
  tease3: 21.85,
  tease4: 22.85,
  founders: 23.85, // the Founders wall: first 100 citizens
  wide: 27.4,      // pull back over the city
  title: 29.0,     // title card and call to action
};
export const DURATION = 32.5;

export const HERO = 'Luna';

// Placeholder names. Replace with real citizens only with their consent.
export const NAMES = ['Luna', 'Kai', 'Mateo', 'Aisha', 'Yuki', 'Priya', 'Noah', 'Zara', 'Leo', 'Amara', 'Sofia', 'Omar', 'Mila', 'Ravi', 'Chloe', 'Diego', 'Nia', 'Arjun', 'Elena', 'Jin', 'Fatima', 'Lucas', 'Maya', 'Tariq', 'Ines'];

// Comments that float up and become citizens at the gate.
export const COMMENTS = [
  { at: 4.15, user: 'kai_88', text: "I'm in ⚡", color: '#e0902b' },
  { at: 4.55, user: 'priya.k', text: 'where do I sign up?', color: '#d6457e' },
  { at: 4.95, user: 'mateo.r', text: 'tap tap tap 👆', color: '#2aa3a3' },
  { at: 5.35, user: 'aisha', text: 'claim my plot!', color: '#8e4fb0' },
  { at: 5.6, user: 'leo_', text: '⚡⚡⚡', color: '#2f5fa8' },
];

// top = pixels from the top of the 1080x1920 frame. TikTok's interface covers
// roughly the bottom quarter and the right edge, so captions sit high.
// Words in {braces} are set in gold.
export const CAPTIONS = [
  { in: 0.3, out: 1.95, top: 250, rule: false, lines: [{ text: 'Zeus is building', size: 74 }, { text: 'a world.', size: 74 }] },
  { in: 2.0, out: 3.95, top: 250, snap: true, rule: false, lines: [{ text: 'Your name', size: 118, gold: true }, { text: 'is in it.', size: 118, gold: true }] },
  { in: 4.05, out: 5.95, top: 230, snap: true, lines: [{ text: 'Comment. Tap. Share.', size: 70 }] },
  { in: 6.05, out: 7.9, top: 230, snap: true, lines: [{ text: "You're a {citizen}", size: 76 }, { text: "it's that easy", size: 52, delay: 0.3 }] },
  { in: 8.0, out: 9.85, top: 200, lines: [{ text: 'Earn {Bolts}', size: 92 }, { text: 'Build your place', size: 60, delay: 0.3 }] },
  { in: 9.95, out: 12.1, top: 230, snap: true, lines: [{ text: 'Upgrade it', size: 84 }] },
  { in: 12.2, out: 13.85, top: 230, snap: true, lines: [{ text: 'Watch your city {rise}', size: 70 }] },
  { in: 13.95, out: 15.85, top: 230, lines: [{ text: 'Zeus shows off', size: 70 }, { text: 'your build {live}', size: 70, delay: 0.25 }] },
  { in: 15.95, out: 17.85, top: 230, snap: true, lines: [{ text: 'Build {together}', size: 84 }] },
  { in: 17.95, out: 19.8, top: 230, snap: true, lines: [{ text: 'what no one', size: 70 }, { text: 'can build {alone}', size: 70, delay: 0.2 }] },
  { in: 19.9, out: 23.8, top: 230, lines: [{ text: "And this is", size: 64 }, { text: 'just the {beginning}', size: 64, delay: 0.3 }] },
  { in: 23.95, out: 25.75, top: 210, snap: true, lines: [{ text: 'The first {100}', size: 96 }, { text: 'citizens', size: 72 }] },
  { in: 25.85, out: 27.35, top: 210, snap: true, lines: [{ text: 'become {Founders}', size: 88 }, { text: 'carved forever', size: 56, delay: 0.3 }] },
];
