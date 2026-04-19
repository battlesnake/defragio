// Device-orientation → game tilt. Calibrates a baseline on the first event
// after the user starts the game so they don't have to hold the device
// perfectly flat. iOS requires a one-shot user-gesture permission; other
// platforms grant orientation events implicitly.

const DEAD_ZONE_DEG = 5;
const FULL_TILT_DEG = 18;     // tilt past this = max steering input
let baseline = null;
let attached = false;

// Map raw device beta/gamma → screen-horizontal tilt regardless of how
// the OS has rotated the screen.
function screenHorizontalTilt(event) {
  const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
  const beta  = event.beta  || 0;
  const gamma = event.gamma || 0;
  switch (angle) {
    case 0:    return gamma;
    case 90:   return -beta;
    case -90:
    case 270:  return beta;
    case 180:  return -gamma;
    default:   return gamma;
  }
}

function setKey(keystate, action, on) {
  if (on) {
    if (!keystate.pressed.has(action)) keystate.pressedEdge.add(action);
    keystate.pressed.add(action);
  } else {
    keystate.pressed.delete(action);
  }
}

function onOrientation(event, keystate) {
  const t = screenHorizontalTilt(event);
  if (baseline === null) baseline = t;
  const delta = t - baseline;

  const left  = delta < -DEAD_ZONE_DEG;
  const right = delta >  DEAD_ZONE_DEG;

  // If user holds a strong tilt, prefer that direction exclusively.
  setKey(keystate, 'left',  left  && !right);
  setKey(keystate, 'right', right && !left);

  // Continuous re-calibration when held near neutral for a while would be
  // nice; for now, the player can re-center by tapping the calibrate hint
  // (TODO if it ever becomes annoying).
  void FULL_TILT_DEG;
}

function startListening(keystate) {
  if (attached) return;
  attached = true;
  baseline = null;
  window.addEventListener('deviceorientation', (e) => onOrientation(e, keystate));
}

// On iOS Safari, DeviceOrientationEvent.requestPermission must be called
// from a user gesture (e.g. modal-close click). On other platforms the
// API exists without the gate.
export async function requestTiltPermission(keystate) {
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === 'function') {
    try {
      const result = await DOE.requestPermission();
      if (result === 'granted') startListening(keystate);
    } catch {
      /* user denied or browser blocked — silently fall back to no tilt */
    }
  } else {
    startListening(keystate);
  }
}

export function recalibrateTilt() {
  baseline = null;
}
