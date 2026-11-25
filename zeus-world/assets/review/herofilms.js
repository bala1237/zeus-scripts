// The library of hero films (ZW-047). A film is footage and sound made in advance, and a list of moments at which the stage draws the
// hero's name. Times are seconds into the film. The scripts themselves, with the reasons for them, are in docs/hero-films/.
//   video      the footage (no sound)                       sound     everything heard except the line that says the name
//   nameLine   when the line with the name is spoken, the recording used when there is none for this name, and where named ones live
//   ember      the hook: an ember crossing the dark (drawn by the page)
//   forge / stone / card   when the name is forged in gold, cut in stone, and shown on the end card
//   captions   the narrator's words, for showing on screen; [NAME] is replaced
export const FILMS = {
  'fire-bringer': { title: 'The Fire-Bringer', honour: 'Fire-Bringer of Olympus', length: 63,
    video: 'hero/fire-bringer.webm', sound: 'hero/fire-bringer.mp3',
    nameLine: { at: 34.6, generic: 'hero/fire-bringer-line5.mp3', named: 'hero/names/' },
    ember: [0.6, 5.6], fadeIn: [5.6, 7.2], forge: [33.3, 34.8, 40.6, 41.8], stone: [53.2, 54.4, 57.2, 58.0], card: [58.2, 59.6],
    captions: [[0.8, 4.6, 'Every city has one night it almost fell.'], [6.6, 12.4, 'The great fire was dying. And in the dark, the city held its breath.'], [15.0, 18.4, 'One of us did not wait to be asked.'],
      [22.6, 31.6, 'Through the storm. Past the fear. Carrying a flame no bigger than a heartbeat, and never once letting it go.'], [34.6, 38.2, '[NAME] brought the fire home.'],
      [43.2, 47.6, 'And every light you see tonight was lit from theirs.'], [52.6, 57.0, 'Olympus stands. Because one heart gave.']] },
};
// a name as it is shown: trimmed, without an @, at most 24 letters. And as a file name, for a recording of the narrator saying it.
export const showName = (s) => String(s || '').replace(/^@+/, '').replace(/\s+/g, ' ').trim().slice(0, 24);
export const slug = (s) => showName(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// how far a moment has come: 0 before a, rising to 1 at b, held, and falling to 0 between c and d (c and d may be left out)
export const span = (t, [a, b, c = Infinity, d = Infinity]) => t < a ? 0 : t < b ? (t - a) / (b - a) : t < c ? 1 : t < d ? 1 - (t - c) / (d - c) : 0;
