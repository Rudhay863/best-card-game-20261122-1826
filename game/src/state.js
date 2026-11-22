// The duel's rules and state: life, energy, hands, shields, the house bond,
// and the score. No rendering here — render.js reads this state and draws it.

import { buildDeck, shuffleDeck } from './cards.js';

export const MAX_LIFE = 20;
export const MAX_HAND = 7;
export const MAX_ENERGY = 5;

export function newDuel(random = Math.random) {
  const playerDeck = shuffleDeck(buildDeck(), random);
  const rivalDeck = shuffleDeck(buildDeck(), random);
  return {
    phase: 'title', // title | playing | rival | won | lost
    round: 1,
    player: {
      life: MAX_LIFE,
      shield: 0,
      energy: 3,
      maxEnergy: 3,
      deck: playerDeck,
      hand: [],
      playedThisTurn: [],
    },
    rival: {
      life: MAX_LIFE,
      shield: 0,
      energy: 3,
      maxEnergy: 3,
      deck: rivalDeck,
      hand: [],
      playedThisTurn: [],
    },
    score: { wins: 0, damage: 0, cards: 0 },
    log: [],
  };
}

export function drawCards(duel, who, count) {
  const side = duel[who];
  for (let i = 0; i < count; i += 1) {
    if (side.hand.length >= MAX_HAND) return;
    const card = side.deck.shift();
    if (!card) return;
    side.hand.push(card);
  }
}

export function startDuel(duel) {
  duel.phase = 'playing';
  duel.round = 1;
  drawCards(duel, 'player', 4);
  drawCards(duel, 'rival', 4);
  addLog(duel, 'The duel begins. Your move — play a card or end your turn.', 'info');
}

export function addLog(duel, text, tone = '') {
  duel.log.push({ text, tone });
  if (duel.log.length > 40) duel.log.shift();
}

// The house bond: the second card of a house played in one turn gains +2 power.
export function bondBonus(duel, who, card) {
  const played = duel[who].playedThisTurn;
  return played.some((playedCard) => playedCard.house === card.house) ? 2 : 0;
}

export function effectivePower(duel, who, card) {
  return card.power + bondBonus(duel, who, card);
}

export function canPlay(duel, who, card) {
  return duel.phase === 'playing' && who === 'player' && card.cost <= duel.player.energy;
}

function dealDamage(duel, target, amount) {
  const side = duel[target];
  const blocked = Math.min(side.shield, amount);
  side.shield -= blocked;
  const through = amount - blocked;
  side.life = Math.max(0, side.life - through);
  return { blocked, through };
}

// Play one card from a hand. Returns a short description of what happened,
// or null when the card cannot be played.
export function playCard(duel, who, cardUid) {
  const side = duel[who];
  const index = side.hand.findIndex((card) => card.uid === cardUid);
  if (index === -1) return null;
  const card = side.hand[index];
  if (card.cost > side.energy) return null;
  if (who === 'player' && duel.phase !== 'playing') return null;

  side.energy -= card.cost;
  side.hand.splice(index, 1);
  const power = effectivePower(duel, who, card);
  side.playedThisTurn.push(card);
  const bonded = power > card.power;
  const actor = who === 'player' ? 'You' : 'Rival';
  const target = who === 'player' ? 'rival' : 'player';

  if (card.kind === 'strike') {
    const { blocked, through } = dealDamage(duel, target, power);
    if (who === 'player') duel.score.damage += through;
    if (who === 'player') duel.score.cards += 1;
    const shieldNote = blocked > 0 ? ` (${blocked} blocked)` : '';
    addLog(duel, `${actor} play ${card.name}${bonded ? ' — house bond +2' : ''}: ${through} damage${shieldNote}.`, who === 'player' ? 'good' : 'bad');
  } else if (card.kind === 'guard') {
    side.shield += power;
    if (who === 'player') duel.score.cards += 1;
    addLog(duel, `${actor} play ${card.name}${bonded ? ' — house bond +2' : ''}: +${power} shield.`, 'info');
  } else {
    side.life = Math.min(MAX_LIFE, side.life + power);
    if (who === 'player') duel.score.cards += 1;
    addLog(duel, `${actor} play ${card.name}${bonded ? ' — house bond +2' : ''}: heal ${power}.`, 'good');
  }
  return { card, power, bonded };
}

export function checkEnd(duel) {
  if (duel.rival.life <= 0) {
    duel.phase = 'won';
    duel.score.wins += 1;
    addLog(duel, 'The rival ember fades. You win the duel.', 'good');
    return 'won';
  }
  if (duel.player.life <= 0) {
    duel.phase = 'lost';
    addLog(duel, 'Your ember goes out. The rival takes this duel.', 'bad');
    return 'lost';
  }
  return null;
}

// Begin a new round for a side: energy refills and grows, one card is drawn,
// and the shield from last round fades.
export function beginRound(duel, who) {
  const side = duel[who];
  side.maxEnergy = Math.min(MAX_ENERGY, 2 + duel.round);
  side.energy = side.maxEnergy;
  side.shield = 0;
  side.playedThisTurn = [];
  drawCards(duel, who, 1);
}

export function endPlayerTurn(duel) {
  if (duel.phase !== 'playing') return;
  duel.phase = 'rival';
  addLog(duel, 'Rival takes the table…', 'info');
}
