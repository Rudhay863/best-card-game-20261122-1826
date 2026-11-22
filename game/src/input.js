// Mouse and keyboard input: click a card or press 1-7 to play it,
// Space ends the turn, Enter starts, R restarts after a win or a loss.
// The duel object is replaced on restart, so every handler reads it through
// hooks.duel() instead of holding the first one.

import { playCard, checkEnd, endPlayerTurn } from './state.js';
import { rivalTurn } from './ai.js';

export function wireInput(hooks) {
  const { render, restart } = hooks;
  const duel = () => hooks.duel();

  function tryPlay(uid) {
    const current = duel();
    const result = playCard(current, 'player', uid);
    if (!result) return;
    hooks.selectedUid = null;
    checkEnd(current);
    render();
  }

  function endTurn() {
    const current = duel();
    if (current.phase !== 'playing') return;
    endPlayerTurn(current);
    render();
    window.setTimeout(() => {
      const later = duel();
      rivalTurn(later);
      checkEnd(later);
      render();
    }, 450);
  }

  hooks.onPlay = tryPlay;
  document.getElementById('end-turn').addEventListener('click', endTurn);
  document.getElementById('start-button').addEventListener('click', () => {
    restart();
  });
  document.getElementById('win-again').addEventListener('click', restart);
  document.getElementById('lose-again').addEventListener('click', restart);

  document.addEventListener('keydown', (event) => {
    const current = duel();
    if (event.key >= '1' && event.key <= '7') {
      const index = Number(event.key) - 1;
      const card = current.player.hand[index];
      if (card && current.phase === 'playing') {
        hooks.selectedUid = card.uid;
        render();
        tryPlay(card.uid);
      }
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      if (current.phase === 'playing') endTurn();
      return;
    }
    if (event.key === 'Enter') {
      if (current.phase === 'title') restart();
      return;
    }
    if (event.key === 'r' || event.key === 'R') {
      if (current.phase === 'won' || current.phase === 'lost') restart();
    }
  });
}
