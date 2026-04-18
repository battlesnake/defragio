import { CONFIG } from '../config.js';

export function createEnemyRenderer(container) {
  return { container, els: new Map() };
}

export function paintEnemies(renderer, enemies, camera) {
  const { container, els } = renderer;
  const stride  = CONFIG.CELL_W + CONFIG.CELL_GAP;
  const strideY = CONFIG.CELL_H + CONFIG.CELL_GAP;

  for (const e of enemies) {
    let el = els.get(e);
    if (!el) {
      el = document.createElement('div');
      el.className = `sprite sprite--enemy sprite--${e.type}`;
      el.style.width  = `${CONFIG.CELL_W}px`;
      el.style.height = `${CONFIG.CELL_H}px`;
      container.appendChild(el);
      els.set(e, el);
    }
    if (!e.alive) {
      el.style.display = 'none';
      continue;
    }
    el.style.display = '';
    const left = (e.x - e.width / 2 - camera.x) * stride;
    const top  = (e.y - e.height / 2) * strideY;
    el.style.transform = `translate(${left}px, ${top}px)`;
  }
}
