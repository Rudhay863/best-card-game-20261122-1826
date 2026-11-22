// The deck of Ember Duel: four houses, each told apart by colour and shape.
// A card is one move: a strike hurts the rival, a guard raises a shield, a mend heals.
// cost is paid in energy, power is the size of the effect.

export const HOUSES = {
  flame: { label: 'Flame', glyph: '▲', colour: '#c93b1e' },
  tide: { label: 'Tide', glyph: '●', colour: '#2b6cb0' },
  leaf: { label: 'Leaf', glyph: '■', colour: '#2f7d4f' },
  spark: { label: 'Spark', glyph: '◆', colour: '#b8860b' },
};

export const CARD_DEFS = [
  { id: 'ember-slash', name: 'Ember Slash', house: 'flame', kind: 'strike', cost: 1, power: 3 },
  { id: 'cinder-jab', name: 'Cinder Jab', house: 'flame', kind: 'strike', cost: 1, power: 2 },
  { id: 'wildfire', name: 'Wildfire', house: 'flame', kind: 'strike', cost: 3, power: 7 },
  { id: 'flare-burst', name: 'Flare Burst', house: 'flame', kind: 'strike', cost: 2, power: 5 },
  { id: 'tide-wall', name: 'Tide Wall', house: 'tide', kind: 'guard', cost: 2, power: 5 },
  { id: 'deep-current', name: 'Deep Current', house: 'tide', kind: 'strike', cost: 2, power: 4 },
  { id: 'surge', name: 'Surge', house: 'tide', kind: 'strike', cost: 1, power: 2 },
  { id: 'still-water', name: 'Still Water', house: 'tide', kind: 'mend', cost: 2, power: 4 },
  { id: 'thorn-vine', name: 'Thorn Vine', house: 'leaf', kind: 'strike', cost: 2, power: 3 },
  { id: 'bloom-mend', name: 'Bloom Mend', house: 'leaf', kind: 'mend', cost: 2, power: 6 },
  { id: 'root-snare', name: 'Root Snare', house: 'leaf', kind: 'strike', cost: 1, power: 2 },
  { id: 'bark-guard', name: 'Bark Guard', house: 'leaf', kind: 'guard', cost: 1, power: 3 },
  { id: 'volt-arc', name: 'Volt Arc', house: 'spark', kind: 'strike', cost: 2, power: 5 },
  { id: 'static-shield', name: 'Static Shield', house: 'spark', kind: 'guard', cost: 1, power: 3 },
  { id: 'overcharge', name: 'Overcharge', house: 'spark', kind: 'strike', cost: 3, power: 6 },
  { id: 'spark-jolt', name: 'Spark Jolt', house: 'spark', kind: 'strike', cost: 1, power: 2 },
];

export const KIND_VERBS = {
  strike: (power) => `Deals ${power} damage`,
  guard: (power) => `Gain ${power} shield`,
  mend: (power) => `Heal ${power} life`,
};

// Build a 24-card deck: every definition once, then eight extra copies of the
// cheapest cards so early hands always have something playable.
export function buildDeck() {
  const deck = CARD_DEFS.map((def) => ({ ...def, uid: def.id + '-a' }));
  const cheap = CARD_DEFS.filter((def) => def.cost === 1);
  cheap.forEach((def, i) => deck.push({ ...def, uid: `${def.id}-b${i}` }));
  return deck;
}

// Fisher-Yates shuffle. Pass a random function so screenshot setups can seed it.
export function shuffleDeck(deck, random = Math.random) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// A tiny seeded random source for deterministic screenshot setups.
export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
