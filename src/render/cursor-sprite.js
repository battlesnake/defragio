import { CONFIG } from '../config.js';
import { cursorAtRow } from '../world/cursor.js';

export function createCursorSprite(container, height) {
  const els = [];
  for (let r = 0; r < height; r++) {
    const d = document.createElement('div');
    d.className = 'sprite sprite--cursor';
    d.style.width  = `${CONFIG.CELL_W}px`;
    d.style.height = `${CONFIG.CELL_H}px`;
    container.appendChild(d);
    els.push(d);
  }
  return els;
}

export function positionCursorSprite(els, cursor, camera) {
  const stride  = CONFIG.CELL_W + CONFIG.CELL_GAP;
  const strideY = CONFIG.CELL_H + CONFIG.CELL_GAP;
  for (let r = 0; r < els.length; r++) {
    const x = cursorAtRow(cursor, r);
    const left = (x - camera.x) * stride;
    const top  = r * strideY;
    els[r].style.transform = `translate(${left}px, ${top}px)`;
  }
}
