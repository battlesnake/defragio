import { CONFIG } from '../config.js';

export function createCamera() {
  return { x: 0, viewportCols: CONFIG.VIEWPORT_COLS };
}

// Player keeps the left 3/4 of the view. Camera scrolls right when the player
// crosses into the right 1/4. Never scrolls left. Clamped so the viewport
// never extends past the level's right edge (no blank right margin).
// Tile-snapped (integer columns).
export function updateCamera(camera, player, levelWidth) {
  const threshold = camera.viewportCols * 0.75;
  const target = Math.floor(player.x - threshold);
  if (target > camera.x) camera.x = target;
  if (camera.x < 0) camera.x = 0;
  const maxCamera = Math.max(0, levelWidth - camera.viewportCols);
  if (camera.x > maxCamera) camera.x = maxCamera;
  return camera;
}

// Reset to origin (called on level start / death respawn).
export function resetCamera(camera) {
  camera.x = 0;
}
