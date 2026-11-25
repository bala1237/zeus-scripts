// TikTok's gifts of 5,000 coins and more, and what the stage does for each (ZW-046). Names and coin prices as listed on
// coinvertify.com/tiktok-gifts (which says its prices were checked 29 Sep 2026) and livecade.io/tiktok-gifts/most-expensive, read 25 Nov 2026.
// TikTok adds, removes and renames gifts, and the catalogue differs by country, so this list will drift: an unknown gift is sized by its coins.
//
// A gift this large gets a figure in the sky: a constellation, drawn by lightning over the temple. The Greeks put their heroes and
// beasts among the stars, so on Zeus's stage a great gift becomes one. The drawings are our own; TikTok's artwork is not copied.
// Gifts are grouped into families that share a figure. A family whose figure is not drawn yet falls back to the big moment.
export const LEGEND_COINS = 5000, SIZES = [[LEGEND_COINS, 'legend'], [1000, 'big'], [100, 'medium'], [0, 'small']];
export const FAMILIES = {
  lion: ['Lion', 'Leon and Lion', 'King Leonardo', 'Black Tiger', 'Cyber Roar', 'Lili the Leopard', 'Leon and Lili', 'Wolf'],
  wings: ['Thunder Falcon', 'Fire Phoenix', 'Phoenix', 'Pegasus', 'Griffin', 'Hawk', 'peacock', 'Bird Whisperer', 'Fantasy Unicorn'],
  dragon: ['Dragon Flame', 'Dragon Gate', 'T-rex', 'Big Dino'],
  cosmos: ['TikTok Universe', 'TikTok Universe+', 'TikTok Stars', 'Interstellar', 'Rosa Nebula', 'Look! Meteor Shower', 'TikTok Shuttle', 'Premium Shuttle', 'Starry Night Tourism', 'Spark', 'DJ Alien'],
  sea: ['Seal and Whale', 'Sam the Whale', 'Undersea Kingdom', 'Octopus', 'Yacht', 'Pirate\'s Ship', 'Level Ship'],
  citadel: ['Light Castle', 'Skyforge Citadel', 'Castle Fantasy', 'Fantasy Castle', 'Gyeongbokgung', 'Big Ben', 'Berlin', 'Pyramids', 'Amusement Park', 'Sweetopia', 'Star Throne'],
  chariot: ['Golden sports car', 'Golden Sports Car', 'Sports Car', 'Silver Sports Car', 'Race Car', 'Bolide', 'Sunset Speedway', 'Red Lightning', 'Motorcycle Together', 'Flying Jets', 'Desert Adventure'],
  heart: ['Infinite Heart', 'Fly Love', 'Rose Carriage', 'Legacy in Bloom', 'Maggie'],
  zeus: ['Zeus'],
  hero: ['Julius the Champion', 'Valerian\'s Oath', 'Legend Marcellus', 'Yuki\'s Vigilance', 'Rin the Snowborn', 'Vulcan', 'Adam\'s Dream', 'Superhero fight', 'Gorilla', 'Guardian Rhino', 'Ellie the Elephant', 'Community Legends', 'Goal of Glory', 'Creator of the week'],
  revel: ['Fiesta', 'Flamenco dancers', 'Corgi\'s Drone Show', 'Red Devil Corgi', 'Festival Flags', 'LIVE Fest Grand Finale', 'Celebration Time', 'Happy Party', 'Birthday Party', 'Saxofone', '1st Anniversary', '2nd Anniversary', '3rd Anniversary'],
};
const BY_NAME = new Map(); for (const [family, names] of Object.entries(FAMILIES)) for (const n of names) BY_NAME.set(n.toLowerCase(), family);
// Figures that are a film clip: a realistic animated clip made for the family, played as the sky behind the temple.
// roar: the clip's big moment, in seconds; the stage's ring, sparks and lasers land on it. seconds: the clip's length.
// The clips were generated on fal with Wan 3.0 Prime (text to video, 1080p), 25 Nov 2026; the prompts are in docs/STAGE-PLAN.md.
export const FILMS = { lion: { src: 'films/lion.webm', roar: 6.2, seconds: 10 },
  // Zeus has a staging of his own (gifts.js): the clip opens a beat in, on his eyes in the dark; "roar" is the second his thunderbolt
  // lands at the foot of the picture, where the temple stands; the show runs five beats past the clip for the lasers to return.
  zeus: { src: 'films/zeus.webm', roar: 8.0, seconds: 14, start: 1, after: 5, staging: 'zeus' } };
// which figures are drawn so far (constellations.js)
export const DRAWN = new Set(['lion']);
// what a gift becomes on the stage: its size, and for the largest the figure to draw (null: not drawn yet, play the big moment)
export function stageGift(giftName, coins) { const size = SIZES.find(([min]) => coins >= min)[1]; if (size !== 'legend') return { size, figure: null };
  const family = BY_NAME.get(String(giftName).toLowerCase()) || null, tier = coins >= 30000 ? 3 : coins >= 15000 ? 2 : 1;   // the bigger the gift, the bigger the show
  return family && (DRAWN.has(family) || FILMS[family]) ? { size, figure: family, tier, label: String(giftName), film: FILMS[family] || null } : { size: 'big', figure: null, family }; }
