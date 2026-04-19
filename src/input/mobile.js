// Coordinates touch + virtual D-pad input on mobile devices.
//
// Detection: matchMedia('(pointer: coarse)') is true on phones/tablets
// (touchscreen primary) and false on laptops/PCs — even touchscreen
// laptops report `pointer: fine` because the trackpad/mouse is the
// primary pointer.

import { attachTouchInput } from './touch.js';
import { attachDpad } from './dpad.js';

export function isMobile() {
  return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
}

export function initMobile(keystate) {
  if (!isMobile()) return;
  document.body.classList.add('is-mobile');
  attachTouchInput(keystate);
  attachDpad(keystate);
}
