// The rival's turn: a readable opponent. It guards when it is hurt, heals when
// it is low, and otherwise strikes with the best card it can afford — and it
// will chase the house bond just like the player.

import { playCard, effectivePower, bondBonus, beginRound, checkEnd, addLog } from './state.js';

function scorePlay(duel, card) {
  const power = effectivePower(duel, 'rival', card);
  if (card.kind === 'strike') {
    // Damage now matters more when the player is close to falling.
    const urgency = duel.player.life <= 6 ? 3 : 0;
    return power + urgency + (bondBonus(duel, 'rival', card) > 0 ? 1 : 0);
  }
  if (card.kind === 'guard') {
    // A shield is worth most when the rival is hurt and the player can hit hard.
    const playerThreat = duel.player.hand.some((c) => c.kind === 'strike' && c.power >= 5) ? 2 : 0;
    return duel.rival.life <= 12 ? power + playerThreat : power - 3;
  }
  // Mend: only worth it when actually hurt.
  return duel.rival.life <= 14 ? power + 1 : -10;
}

export function rivalTurn(duel) {
  // The rival plays one card at a time, best first, until it runs out of
  // energy or useful plays, then the round passes back to the player.
  const plays = [];
  for (;;) {
    const affordable = duel.rival.hand.filter((card) => card.cost <= duel.rival.energy);
    if (affordable.length === 0) break;
    affordable.sort((a, b) => scorePlay(duel, b) - scorePlay(duel, a));
    const best = affordable[0];
    if (scorePlay(duel, best) < 1) break;
    const result = playCard(duel, 'rival', best.uid);
    if (!result) break;
    plays.push(result);
    if (checkEnd(duel)) return plays;
  }
  if (plays.length === 0) addLog(duel, 'Rival holds its cards and passes.', 'info');
  duel.round += 1;
  beginRound(duel, 'player');
  beginRound(duel, 'rival');
  duel.phase = 'playing';
  addLog(duel, `Round ${duel.round} — your move.`, 'info');
  return plays;
}
