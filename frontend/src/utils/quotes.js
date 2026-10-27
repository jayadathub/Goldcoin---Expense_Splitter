import heroArt from '../assets/hero_art.jpg';
import heroJourney from '../assets/hero_journey.jpg';
import heroCafe from '../assets/hero_cafe.jpg';
import heroCampfire from '../assets/hero_campfire.jpg';

export const HERO_THEMES = [
  {
    id: 0,
    image: heroArt,
    locationLabel: '📍 Together on the journey',
    vibeLabel: '🌾 Autumn Serenity',
    tagPill: '☕ The Art of Easy Sharing',
    tagEmoji: '☕',
    quote: '“Count the shared memories, the late-night laughs, and the long roads — never the petty numbers.”',
    author: '— Settle with grace, journey in harmony',
    description:
      'Keep track of every shared meal, flat expense, and weekend getaway without awkward reminders. Our minimal-transaction algorithm takes care of the math behind the scenes.',
  },
  {
    id: 1,
    image: heroJourney,
    locationLabel: '📍 Mountain pass overlook',
    vibeLabel: '🌅 Golden Hour Wanderlust',
    tagPill: '🛣️ Long Roads & True Friends',
    tagEmoji: '🛣️',
    quote: '“A journey is best measured in friends, rather than miles. Let every settlement be as gentle as the open road.”',
    author: '— Timeless road, united spirits',
    description:
      'From highway tolls to scenic cabin stays, keep every mile effortless and joyful with transparent balances and consolidated trip clusters.',
  },
  {
    id: 2,
    image: heroCafe,
    locationLabel: '📍 Sunlit corner table',
    vibeLabel: '🥐 Morning Coffee & Laughs',
    tagPill: '☕ Moments That Matter',
    tagEmoji: '☕',
    quote: '“Friendship is sharing quiet moments, endless cups of coffee, and never worrying who got the last pastry.”',
    author: '— Sunlight through the cafe glass',
    description:
      'Split cafe treats, grocery hauls, and spontaneous dinners without awkward tabs or second-guessing.',
  },
  {
    id: 3,
    image: heroCampfire,
    locationLabel: '📍 Twilight beach campfire',
    vibeLabel: '✨ Starlight & Acoustic Chords',
    tagPill: '🔥 Warm Embers & Simple Kindness',
    tagEmoji: '🔥',
    quote: '“Around the campfire, under a canopy of stars, we share stories and songs — and settle what’s owed with simple grace.”',
    author: '— Night skies & heartfelt chords',
    description:
      'Group camping trips, beach bonfires, and weekend festivals are made for connection. Let smart debt simplification handle the math.',
  },
];

export const getActiveTheme = () => {
  const stored = localStorage.getItem('quote_login_index');
  if (stored !== null) {
    const idx = parseInt(stored, 10);
    if (!isNaN(idx) && idx >= 0 && idx < HERO_THEMES.length) {
      return HERO_THEMES[idx];
    }
  }
  // Default to a random theme if not set
  const randomIdx = Math.floor(Math.random() * HERO_THEMES.length);
  localStorage.setItem('quote_login_index', randomIdx.toString());
  return HERO_THEMES[randomIdx];
};

export const rotateToNextTheme = () => {
  const current = parseInt(localStorage.getItem('quote_login_index') || '0', 10);
  const next = (current + 1) % HERO_THEMES.length;
  localStorage.setItem('quote_login_index', next.toString());
  window.dispatchEvent(new Event('quote-updated'));
  return HERO_THEMES[next];
};
