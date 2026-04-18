// Konami-style cheat detector.
//   blyat  → +10 lives; also unlocks the level-skip keys
//   [ / ]  → previous / next level (only after blyat)

import { cheatJumpLevel } from '../game.js';

const MAX_BUFFER = 16;

export function attachCheatListener(game, target = window) {
  let buffer = '';
  let unlocked = false;

  target.addEventListener('keydown', (e) => {
    if (!e.key) return;

    // Level-skip keys, only after blyat has been entered.
    if (unlocked && (e.key === '[' || e.key === ']')) {
      e.preventDefault();
      cheatJumpLevel(game, e.key === ']' ? +1 : -1);
      return;
    }

    if (e.key.length !== 1) return;
    if (!/[a-zA-Z]/.test(e.key)) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-MAX_BUFFER);
    if (buffer.endsWith('blyat')) {
      game.lives += 10;
      buffer = '';
      unlocked = true;
      // eslint-disable-next-line no-console
      console.log(`[cheat] +10 lives (now ${game.lives}); level skip [/] enabled`);
    }
  });
}
