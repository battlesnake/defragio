import { CONFIG } from '../config.js';
import { cursorMean } from '../world/cursor.js';

export function createCamera() {
  return { x: 0, viewportCols: CONFIG.VIEWPORT_COLS };
}

export function updateCamera(camera, player, cursor) {
  const targetByPlayer = player.x - camera.viewportCols / 3;
  const targetByCursor = cursorMean(cursor) - 2;
  camera.x = Math.max(targetByPlayer, targetByCursor, 0);
  return camera;
}
