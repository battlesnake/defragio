import { CONFIG } from '../config.js';

export function createCamera() {
  return { x: 0, viewportCols: CONFIG.VIEWPORT_COLS };
}

// Player-only follow. Integer-snapped (tile-by-tile scrolling).
export function updateCamera(camera, player) {
  const targetX = Math.floor(player.x - camera.viewportCols / 3);
  camera.x = Math.max(0, targetX);
  return camera;
}
