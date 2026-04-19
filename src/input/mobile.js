// Coordinates touch + tilt input on mobile devices.
//
// Detection: matchMedia('(pointer: coarse)') is true on phones/tablets
// (touchscreen primary) and false on laptops/PCs — even touchscreen
// laptops report `pointer: fine` because the trackpad/mouse is the
// primary pointer.

import { attachTouchInput } from './touch.js';
import { requestTiltPermission } from './tilt.js';
import { registerOnControlsClose } from '../render/buttons.js';

export function isMobile() {
  return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
}

export function initMobile(keystate) {
  if (!isMobile()) return;

  document.body.classList.add('is-mobile');
  attachTouchInput(keystate);

  // iOS requires the orientation-permission prompt to come from a user
  // gesture, AND the user should already understand why we're asking —
  // so we wait until they've dismissed the Controls modal.
  let asked = false;
  registerOnControlsClose(() => {
    if (asked) return;
    asked = true;
    requestTiltPermission(keystate);
  });

  bindLandscapeTip();
}

function bindLandscapeTip() {
  const tip = document.getElementById('landscape-tip');
  if (!tip) return;
  const update = () => {
    const portrait = window.matchMedia('(orientation: portrait)').matches;
    tip.hidden = !portrait;
  };
  update();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
}
