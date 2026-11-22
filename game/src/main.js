// Ember Duel boot: build a fresh duel, wire the input, draw the table.
// ?shot=title|table|win|loss sets up a fixed scene for screenshots.

import { newDuel, startDuel, playCard, checkEnd } from './state.js';
import { seededRandom } from './cards.js';
import { renderDuel } from './render.js';
import { wireInput } from './input.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

let duel = newDuel(shot ? seededRandom(20261122) : Math.random);

const hooks = {
  selectedUid: null,
  onPlay: () => {},
  duel: () => duel,
  render: () => renderDuel(duel, hooks),
  restart: () => {
    duel = newDuel(Math.random);
    startDuel(duel);
    hooks.selectedUid = null;
    renderDuel(duel, hooks);
  },
};

function setupShot(kind) {
  startDuel(duel);
  if (kind === 'title') {
    duel.phase = 'title';
    duel.log = [{ text: 'The table waits for the first deal.', tone: 'info' }];
    return;
  }
  if (kind === 'table') {
    // A mid-game table: two strikes already played for real, life totals
    // moved, both hands full, energy spent — the duel in full swing.
    // The score is derived from the actual damage those plays dealt.
    const strikes = duel.player.hand.filter((card) => card.kind === 'strike' && card.cost <= 2);
    if (strikes[0]) playCard(duel, 'player', strikes[0].uid);
    const again = duel.player.hand.find((card) => card.kind === 'strike' && card.cost <= duel.player.energy);
    if (again) playCard(duel, 'player', again.uid);
    duel.round = 2;
    duel.player.life = 17;
    duel.player.shield = 3;
    duel.score.damage = 20 - duel.rival.life;
    duel.score.cards = duel.player.playedThisTurn.length;
    duel.log.push({ text: 'Rival plays Deep Current: 4 damage (3 blocked).', tone: 'bad' });
    duel.log.push({ text: 'Round 2 — your move.', tone: 'info' });
    return;
  }
  if (kind === 'win') {
    duel.rival.life = 0;
    duel.score.damage = 20;
    duel.score.cards = 9;
    duel.round = 4;
    checkEnd(duel);
    return;
  }
  if (kind === 'loss') {
    duel.player.life = 0;
    duel.score.damage = 13;
    duel.score.cards = 8;
    duel.round = 5;
    checkEnd(duel);
  }
}

wireInput(hooks);
if (shot) setupShot(shot);
renderDuel(duel, hooks);
