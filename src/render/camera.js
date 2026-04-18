import { CONFIG } from '../config.js';

export function createCamera() {
  return { x: 0, viewportCols: CONFIG.VIEWPORT_COLS };
}

// Player keeps the left 3/4 of the view. Camera scrolls right when the player
// crosses into the right 1/4. Never scrolls left (one-way Mario-style camera).
// Tile-snapped (integer columns).
export function updateCamera(camera, player) {
  const threshold = camera.viewportCols * 0.75;
  const target = Math.floor(player.x - threshold);
  if (target > camera.x) camera.x = target;
  if (camera.x < 0) camera.x = 0;
  return camera;
}

// Reset to origin (called on level start / death respawn).
export function resetCamera(camera) {
  camera.x = 0;
}
