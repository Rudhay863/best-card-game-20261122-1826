// Drawing the table: life bars, hands, the played cards, the log, energy,
// and the title, win and loss screens. Reads the duel state, writes the DOM.

import { HOUSES, KIND_VERBS } from './cards.js';
import { MAX_LIFE, effectivePower } from './state.js';

const $ = (id) => document.getElementById(id);

function cardElement(card, options = {}) {
  const house = HOUSES[card.house];
  const el = document.createElement('div');
  el.className = `card house-${card.house}`;
  el.dataset.uid = card.uid;
  if (options.playable === false) el.classList.add('unplayable');
  if (options.selected) el.classList.add('selected');
  el.innerHTML =
    (options.keyLabel ? `<span class="key">${options.keyLabel}</span>` : '') +
    `<span class="cost" title="Energy cost">${card.cost}</span>` +
    `<span class="house">${house.label}</span>` +
    `<span class="glyph" aria-hidden="true">${house.glyph}</span>` +
    `<span class="name">${card.name}</span>` +
    `<span class="effect">${KIND_VERBS[card.kind](options.power ?? card.power)}</span>`;
  if (options.onClick) {
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.addEventListener('click', options.onClick);
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        options.onClick();
      }
    });
  }
  return el;
}

function backElement() {
  const el = document.createElement('div');
  el.className = 'card back';
  el.innerHTML = '<span class="back-mark">E</span>';
  return el;
}

export function renderDuel(duel, hooks) {
  // Life bars and shields.
  $('player-life').textContent = duel.player.life;
  $('rival-life').textContent = duel.rival.life;
  $('player-life-fill').style.width = `${(duel.player.life / MAX_LIFE) * 100}%`;
  $('rival-life-fill').style.width = `${(duel.rival.life / MAX_LIFE) * 100}%`;
  const playerShield = $('player-shield');
  const rivalShield = $('rival-shield');
  playerShield.hidden = duel.player.shield <= 0;
  rivalShield.hidden = duel.rival.shield <= 0;
  playerShield.textContent = `Shield ${duel.player.shield}`;
  rivalShield.textContent = `Shield ${duel.rival.shield}`;

  // Score and round.
  $('score-wins').textContent = duel.score.wins;
  $('score-damage').textContent = duel.score.damage;
  $('score-cards').textContent = duel.score.cards;
  $('round-label').textContent = `Round ${duel.round}`;

  // Rival hand: face-down cards, one per card held.
  const rivalHand = $('rival-hand');
  rivalHand.replaceChildren();
  duel.rival.hand.forEach(() => rivalHand.appendChild(backElement()));

  // Player hand: real cards, with cost, house and effect readable.
  const playerHand = $('player-hand');
  playerHand.replaceChildren();
  duel.player.hand.forEach((card, index) => {
    const playable = duel.phase === 'playing' && card.cost <= duel.player.energy;
    const power = effectivePower(duel, 'player', card);
    const el = cardElement(card, {
      playable,
      power,
      keyLabel: String(index + 1),
      selected: hooks.selectedUid === card.uid,
      onClick: playable ? () => hooks.onPlay(card.uid) : undefined,
    });
    playerHand.appendChild(el);
  });

  // The cards played this round, both sides, latest last.
  const played = $('played');
  played.replaceChildren();
  const both = [...duel.player.playedThisTurn, ...duel.rival.playedThisTurn];
  if (both.length === 0) {
    const note = document.createElement('span');
    note.className = 'empty-note';
    note.textContent = duel.phase === 'title'
      ? 'The table waits for the first deal.'
      : 'Played cards land here.';
    played.appendChild(note);
  } else {
    both.slice(-6).forEach((card) => played.appendChild(cardElement(card, {})));
  }

  // Energy pips.
  const energy = $('energy');
  energy.replaceChildren();
  const label = document.createElement('span');
  label.textContent = `Energy ${duel.player.energy} / ${duel.player.maxEnergy}`;
  energy.appendChild(label);
  for (let i = 0; i < duel.player.maxEnergy; i += 1) {
    const pip = document.createElement('span');
    pip.className = `pip${i < duel.player.energy ? ' on' : ''}`;
    energy.appendChild(pip);
  }

  // The log, newest at the bottom.
  const log = $('log');
  log.replaceChildren();
  duel.log.slice(-4).forEach((entry) => {
    const line = document.createElement('div');
    if (entry.tone) line.className = entry.tone;
    line.textContent = entry.text;
    log.appendChild(line);
  });
  log.scrollTop = log.scrollHeight;

  $('end-turn').disabled = duel.phase !== 'playing';

  // Screens.
  $('title-screen').hidden = duel.phase !== 'title';
  $('win-screen').hidden = duel.phase !== 'won';
  $('lose-screen').hidden = duel.phase !== 'lost';
  if (duel.phase === 'won') {
    $('win-stats').innerHTML =
      `Damage dealt <strong>${duel.score.damage}</strong> · Cards played <strong>${duel.score.cards}</strong> · Round <strong>${duel.round}</strong>`;
  }
  if (duel.phase === 'lost') {
    $('lose-stats').innerHTML =
      `Damage dealt <strong>${duel.score.damage}</strong> · Cards played <strong>${duel.score.cards}</strong> · Round <strong>${duel.round}</strong>`;
  }
}
