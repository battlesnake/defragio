// Wires the chrome's Pause and Legend buttons to game logic + the legend modal.

import { togglePause } from '../game.js';

let pauseBtn = null;
let legendBtn = null;
let stopBtn = null;
let modal = null;
let modalClose = null;

export function bindButtons(game) {
  pauseBtn   = document.getElementById('btn-pause');
  legendBtn  = document.getElementById('btn-legend');
  stopBtn    = document.getElementById('btn-stop');
  modal      = document.getElementById('legend-modal');
  modalClose = document.getElementById('legend-close');

  if (pauseBtn) {
    pauseBtn.addEventListener('click', (e) => { togglePause(game); e.currentTarget.blur(); });
  }
  if (legendBtn) {
    legendBtn.addEventListener('click', (e) => { openLegend(game); e.currentTarget.blur(); });
  }
  if (modalClose) {
    modalClose.addEventListener('click', (e) => { closeLegend(game); e.currentTarget.blur && e.currentTarget.blur(); });
  }
  // Esc closes the legend
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) closeLegend(game);
  });
  // P toggles pause — but only mid-game (not during 'waiting' so the
  // first input always starts the game; not during animation states).
  window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
      if (game.state === 'playing' || game.state === 'paused') togglePause(game);
    }
  });
}

function openLegend(game) {
  if (!modal) return;
  modal.hidden = false;
  if (game.state !== 'paused') {
    game.pausedFromLegend = true;
    togglePause(game);
  }
}

function closeLegend(game) {
  if (!modal) return;
  modal.hidden = true;
  if (game.pausedFromLegend) {
    game.pausedFromLegend = false;
    togglePause(game);
  }
}

export function syncPauseButton(game) {
  if (!pauseBtn) return;
  pauseBtn.innerHTML = game.state === 'paused' ? '<u>R</u>esume' : '<u>P</u>ause';
}
