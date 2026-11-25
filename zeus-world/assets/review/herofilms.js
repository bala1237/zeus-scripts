// The library of hero films (ZW-047). A film is footage and sound made in advance, and a list of moments at which the stage draws the
// hero's name. Times are seconds into the film. The scripts themselves, with the reasons for them, are in docs/hero-films/.
//   video      the footage (no sound)                       sound     everything heard except the line that says the name
//   nameLine   when the line with the name is spoken, the recording used when there is none for this name, and where named ones live
//   ember      the hook: an ember crossing the dark (drawn by the page)
//   forgeTop   how far down the picture the forged name sits, in hundredths of its height (30 if left out): put it clear of the hero
//   forge / stone / card   when the name is forged in gold, cut in stone, and shown on the end card
//   captions   the narrator's words, for showing on screen; [NAME] is replaced
export const FILMS = {
  'fire-bringer': { title: 'The Fire-Bringer', honour: 'Fire-Bringer of Olympus', length: 63,
    video: 'hero/fire-bringer.webm', sound: 'hero/fire-bringer.mp3',
    nameLine: { at: 34.9, generic: 'hero/fire-bringer-line5.mp3', named: 'hero/names/' },
    ember: [4.8, 8.9], forge: [33.35, 35.0, 38.2, 39.1], stone: [53.6, 54.8, 57.4, 58.2], card: [58.4, 59.8],
    captions: [[0.8, 3.6, 'Ask anyone who was there that night what they saw.'], [5.4, 7.7, 'They will not speak of the storm.'], [9.2, 14.7, 'The great fire of Olympus was dying. And when it went out, the city would go with it.'],
      [15.4, 20.0, 'No one was sent. One of us simply stood, and began to climb.'], [21.4, 26.6, 'The storm took everything it could. Halfway up, the flame was almost gone.'], [27.4, 28.9, 'Almost.'],
      [34.9, 37.6, '[NAME] brought the fire home.'], [42.6, 45.6, 'And every light you see tonight was lit from theirs.'], [47.4, 49.3, 'That is what they saw.'], [52.6, 55.9, 'Olympus stands. Because one heart gave.']] },
  // For a battle that was lost. Two moving shots and four still pictures (see hero-build/build.py).
  'last-banner': { title: 'The Last Banner', honour: 'Keeper of the Banner', length: 46,
    video: 'hero/last-banner.webm', sound: 'hero/last-banner.mp3',
    nameLine: { at: 30.3, generic: 'hero/last-banner-line.mp3', named: 'hero/names-last-banner/' },
    forge: [29.4, 31.0, 35.5, 36.3], forgeTop: 6, card: [41.4, 42.8],
    captions: [[0.6, 3.9, 'Count the fallen shields, and you will say the day was lost.'], [5.6, 7.3, 'You would be right.'], [7.9, 13.9, 'By dusk the line had broken. In the smoke, no one could tell the way home.'],
      [14.6, 19.3, 'One of us turned back. Not to fight. To be seen.'], [20.6, 27.0, 'The wind tore at it. The dark closed in. And still it stood.'], [30.3, 32.4, '[NAME] held the banner.'],
      [32.6, 35.5, 'And by it, every one of us came home.'], [37.3, 40.9, 'A day can be lost. Not the ones who stood in it.']] },
  // For pure generosity. Two moving shots and five still pictures.
  'the-well': { title: 'The Well', honour: 'Water-Bearer', length: 47.5,
    video: 'hero/the-well.webm', sound: 'hero/the-well.mp3',
    nameLine: { at: 29.4, generic: 'hero/the-well-line.mp3', named: 'hero/names-the-well/' },
    forge: [28.8, 30.4, 33.3, 34.1], forgeTop: 4, card: [42.6, 44.0],
    captions: [[2.8, 5.5, 'There is a sound the desert had forgotten.'], [6.2, 11.1, 'Nine days without water. The caravan had stopped walking.'], [12.4, 16.6, 'One of us picked up an empty jar, and walked into the sand alone.'],
      [17.9, 23.8, 'The storm buried the road behind. There was nothing left to follow but hope.'], [29.4, 31.4, '[NAME] found the water.'], [31.6, 33.8, 'And carried it back for everyone.'],
      [34.7, 37.8, 'No one who drank that day ever forgot who brought it.'], [39.9, 42.2, 'That is how a desert becomes a home.']] },
};
// a name as it is shown: trimmed, without an @, at most 24 letters. And as a file name, for a recording of the narrator saying it.
export const showName = (s) => String(s || '').replace(/^@+/, '').replace(/\s+/g, ' ').trim().slice(0, 24);
export const slug = (s) => showName(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// how far a moment has come: 0 before a, rising to 1 at b, held, and falling to 0 between c and d (c and d may be left out)
export const span = (t, [a, b, c = Infinity, d = Infinity]) => t < a ? 0 : t < b ? (t - a) / (b - a) : t < c ? 1 : t < d ? 1 - (t - c) / (d - c) : 0;
