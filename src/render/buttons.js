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
    pauseBtn.addEventListener('click', () => togglePause(game));
  }
  if (legendBtn) {
    legendBtn.addEventListener('click', () => openLegend(game));
  }
  if (modalClose) {
    modalClose.addEventListener('click', () => closeLegend(game));
  }
  // Esc closes the legend
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) closeLegend(game);
  });
  // P toggles pause (also via the keyboard)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
      // Don't pause in the middle of typing a cheat code that starts with p (none yet)
      togglePause(game);
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
