// Tap anywhere on the stage (outside buttons / modals) → jump.
// Press on touchstart, release on touchend, so holding the tap gives
// variable jump height and a fresh tap mid-air triggers double-jump.

function isInteractiveTarget(el) {
  while (el && el !== document.body) {
    if (el.tagName === 'BUTTON' || el.tagName === 'A') return true;
    if (el.classList && (el.classList.contains('win__btn') || el.classList.contains('legend-modal'))) return true;
    el = el.parentElement;
  }
  return false;
}

function pressJump(keystate) {
  if (!keystate.pressed.has('jump')) keystate.pressedEdge.add('jump');
  keystate.pressed.add('jump');
}

function releaseJump(keystate) {
  keystate.pressed.delete('jump');
}

export function attachTouchInput(keystate) {
  const stage = document.getElementById('stage') || document.body;

  stage.addEventListener('touchstart', (e) => {
    if (isInteractiveTarget(e.target)) return;
    e.preventDefault();
    pressJump(keystate);
  }, { passive: false });

  stage.addEventListener('touchend', (e) => {
    if (isInteractiveTarget(e.target)) return;
    e.preventDefault();
    releaseJump(keystate);
  }, { passive: false });

  stage.addEventListener('touchcancel', () => releaseJump(keystate));
}
