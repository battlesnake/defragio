// Tap anywhere outside the D-pad / buttons / modals → jump.
// Press on touchstart, release on touchend, so holding the tap gives
// variable jump height and a fresh tap mid-air triggers double-jump.
//
// Listening on the document so taps anywhere on screen count, not just
// inside the game window.

function isInteractiveTarget(el) {
  while (el && el !== document.body) {
    if (el.tagName === 'BUTTON' || el.tagName === 'A') return true;
    if (el.classList && (
      el.classList.contains('win__btn') ||
      el.classList.contains('legend-modal') ||
      el.classList.contains('dpad') ||
      el.classList.contains('portrait-block')
    )) return true;
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
  document.addEventListener('touchstart', (e) => {
    if (isInteractiveTarget(e.target)) return;
    e.preventDefault();
    pressJump(keystate);
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    if (isInteractiveTarget(e.target)) return;
    e.preventDefault();
    releaseJump(keystate);
  }, { passive: false });

  document.addEventListener('touchcancel', () => releaseJump(keystate));
}
