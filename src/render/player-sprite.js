import { CONFIG } from '../config.js';

export function createPlayerSprite(container) {
  const el = document.createElement('div');
  el.className = 'sprite sprite--player';
  el.style.width  = `${CONFIG.CELL_W}px`;
  el.style.height = `${CONFIG.CELL_H}px`;
  container.appendChild(el);
  return el;
}

export function positionPlayerSprite(el, player, camera) {
  const stride = CONFIG.CELL_W + CONFIG.CELL_GAP;
  const strideY = CONFIG.CELL_H + CONFIG.CELL_GAP;
  const cellLeft = (player.x - player.width / 2 - camera.x) * stride;
  const cellTop  = (player.y - player.height / 2) * strideY;
  el.style.transform = `translate(${cellLeft}px, ${cellTop}px)`;
}
