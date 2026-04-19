// Wires the chrome's Pause / Controls / Legend / About buttons.

import { togglePause } from '../game.js';

const MODALS = ['legend', 'controls', 'about'];

let pauseBtn = null;
const modalEls = {};
const controlsCloseListeners = [];

export function registerOnControlsClose(cb) {
  controlsCloseListeners.push(cb);
}

export function bindButtons(game) {
  pauseBtn = document.getElementById('btn-pause');

  if (pauseBtn) {
    pauseBtn.addEventListener('click', (e) => { togglePause(game); e.currentTarget.blur(); });
  }

  for (const name of MODALS) {
    const btn   = document.getElementById(`btn-${name}`);
    const modal = document.getElementById(`${name}-modal`);
    const close = document.getElementById(`${name}-close`);
    modalEls[name] = modal;
    if (btn && modal) {
      btn.addEventListener('click', (e) => {
        openModal(game, name);
        e.currentTarget.blur();
      });
    }
    if (close && modal) {
      close.addEventListener('click', (e) => {
        closeModal(game, name);
        e.currentTarget.blur && e.currentTarget.blur();
      });
    }
  }

  // Esc closes whichever modal is open.
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    for (const name of MODALS) {
      const m = modalEls[name];
      if (m && !m.hidden) { closeModal(game, name); return; }
    }
  });

  // P toggles pause — only mid-game / mid-pause.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
      if (game.state === 'playing' || game.state === 'paused') togglePause(game);
    }
  });
}

function openModal(game, name) {
  // Close any other open modal first.
  for (const other of MODALS) {
    if (other !== name && modalEls[other] && !modalEls[other].hidden) {
      closeModal(game, other);
    }
  }
  const modal = modalEls[name];
  if (!modal) return;
  modal.hidden = false;
  if (game.state !== 'paused') {
    game.pausedFromModal = true;
    togglePause(game);
  }
}

function closeModal(game, name) {
  const modal = modalEls[name];
  if (!modal) return;
  modal.hidden = true;
  if (game.pausedFromModal) {
    game.pausedFromModal = false;
    togglePause(game);
  }
  if (name === 'controls') {
    for (const cb of controlsCloseListeners) cb();
  }
}

// Programmatically open the controls modal — used to greet the player on page load.
export function openControls(game) {
  openModal(game, 'controls');
}

export function syncPauseButton(game) {
  if (!pauseBtn) return;
  pauseBtn.innerHTML = game.state === 'paused' ? '<u>R</u>esume' : '<u>P</u>ause';
}
