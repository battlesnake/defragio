// Virtual D-pad for mobile. The user puts a finger anywhere inside the
// pad and slides around — direction is computed from finger position
// relative to the pad's centre. Each axis has a dead zone, so a finger
// near the centre presses nothing; a finger in a corner presses two
// adjacent arrows (e.g. up + right).

const DEAD_ZONE_FRAC = 0.22;

function setKey(keystate, action, on) {
  if (on) {
    if (!keystate.pressed.has(action)) keystate.pressedEdge.add(action);
    keystate.pressed.add(action);
  } else {
    keystate.pressed.delete(action);
  }
}

export function attachDpad(keystate) {
  const pad = document.getElementById('dpad');
  if (!pad) return;

  let activeId = null;
  let cx = 0, cy = 0, r = 0;

  function recalc() {
    const rect = pad.getBoundingClientRect();
    cx = rect.left + rect.width / 2;
    cy = rect.top  + rect.height / 2;
    r  = rect.width / 2;
  }

  function update(touch) {
    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;
    const t  = DEAD_ZONE_FRAC * r;
    setKey(keystate, 'left',  dx < -t);
    setKey(keystate, 'right', dx >  t);
    setKey(keystate, 'jump',  dy < -t);
    setKey(keystate, 'drop',  dy >  t);
  }

  function release() {
    setKey(keystate, 'left',  false);
    setKey(keystate, 'right', false);
    setKey(keystate, 'jump',  false);
    setKey(keystate, 'drop',  false);
  }

  pad.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (activeId !== null) return;
    recalc();
    const t = e.changedTouches[0];
    activeId = t.identifier;
    update(t);
  }, { passive: false });

  pad.addEventListener('touchmove', (e) => {
    if (activeId === null) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === activeId) { update(t); break; }
    }
  }, { passive: false });

  function endHandler(e) {
    if (activeId === null) return;
    for (const t of e.changedTouches) {
      if (t.identifier === activeId) { activeId = null; release(); break; }
    }
  }
  pad.addEventListener('touchend',    endHandler);
  pad.addEventListener('touchcancel', endHandler);

  window.addEventListener('resize', recalc);
  window.addEventListener('orientationchange', () => setTimeout(recalc, 100));
}
