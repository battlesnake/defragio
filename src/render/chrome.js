const els = {
  title:    null,
  status:   null,
  pct:      null,
  progress: null,
};

export function bindChrome() {
  els.title    = document.getElementById('title');
  els.status   = document.getElementById('status-text');
  els.pct      = document.getElementById('status-pct');
  els.progress = document.getElementById('progress-bar');
}

export function updateChrome(game) {
  if (!els.title) return;
  els.title.textContent = `Defragmenting Drive C — Level ${game.level.id}: ${game.level.name}`;
  const playerCol = Math.floor(game.player.x);
  const cluster = playerCol.toString(16).padStart(4, '0').toUpperCase();
  const lives = game.lives.toString().padStart(2, '0');
  if (game.state === 'waiting') {
    els.status.textContent = `Ready · ${lives} lives · press ← → ↑ ↓ / WASD / Space to begin`;
  } else {
    els.status.textContent = `Defragmenting file system... · cluster 0x${cluster} · ${lives} lives`;
  }
  const pct = Math.max(0, Math.min(100, Math.floor((game.player.x / game.level.width) * 100)));
  els.pct.textContent = `${pct}% Complete`;
  els.progress.style.width = `${pct}%`;
}
