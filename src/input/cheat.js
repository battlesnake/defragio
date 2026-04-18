// Konami-style cheat detector. Tracks the last few alphabetic keypresses;
// when the buffer ends with a known cheat string, fires its handler.

const MAX_BUFFER = 16;

export function attachCheatListener(game, target = window) {
  let buffer = '';
  target.addEventListener('keydown', (e) => {
    if (!e.key || e.key.length !== 1) return;
    if (!/[a-zA-Z]/.test(e.key)) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-MAX_BUFFER);
    if (buffer.endsWith('blyat')) {
      game.lives += 10;
      buffer = '';
      // Tiny ack in the console — no chrome change so it stays period-correct
      // eslint-disable-next-line no-console
      console.log(`[cheat] +10 lives (now ${game.lives})`);
    }
  });
}
