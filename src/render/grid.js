import { cellClassFor } from '../world/tile.js';
import { defragOpAt } from '../world/defrag.js';
import { CONFIG } from '../config.js';

export function createGridRenderer({ container, viewportCols, viewportRows, cellWidth = 10, cellHeight = 14 }) {
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.style.gridTemplateColumns = `repeat(${viewportCols}, ${cellWidth}px)`;
  grid.style.gridAutoRows = `${cellHeight}px`;
  grid.style.gap = '1px';
  grid.style.background = '#fff';
  grid.style.width = 'max-content';

  const cells = [];
  for (let i = 0; i < viewportRows * viewportCols; i++) {
    const d = document.createElement('div');
    d.className = 'cell cell--free';
    grid.appendChild(d);
    cells.push(d);
  }
  container.appendChild(grid);

  return { cells, viewportCols, viewportRows, cellWidth, cellHeight, grid };
}

// Paint order: tiles → defrag op tells → flush particles → coin burst → enemies → player → HUD.
// Each particle maps to its containing cell (floor(x), floor(y)); when two
// particles occupy the same cell, the one written later wins.
export function paintGrid(renderer, level, camera, defrag, enemies = [], player = null, particles = null, coins = 0, coinBurst = null) {
  const { cells, viewportCols, viewportRows } = renderer;
  const xOffset = camera.x;

  // 1. Base tiles (clear text content too — cells are pooled)
  for (let r = 0; r < viewportRows; r++) {
    for (let c = 0; c < viewportCols; c++) {
      const worldCol = xOffset + c;
      let tileClass = 'cell--free';
      if (r >= 0 && r < level.height && worldCol >= 0 && worldCol < level.width) {
        tileClass = cellClassFor(level.tiles[r][worldCol]);
      }
      const cell = cells[r * viewportCols + c];
      cell.className = `cell ${tileClass}`;
      if (cell.textContent !== '') cell.textContent = '';
    }
  }

  // 2b. Defrag op tells (read/write flashes)
  if (defrag) {
    for (let r = 0; r < viewportRows; r++) {
      for (let c = 0; c < viewportCols; c++) {
        const worldCol = xOffset + c;
        if (worldCol < 0 || worldCol >= level.width) continue;
        const op = defragOpAt(defrag, r, worldCol);
        if (op === 'read')  cells[r * viewportCols + c].className = 'cell cell--read';
        if (op === 'write') cells[r * viewportCols + c].className = 'cell cell--write';
      }
    }
  }

  // 3. Flush particles (positions are in pixel space; map to grid cells)
  if (particles) {
    const sx = CONFIG.CELL_W + CONFIG.CELL_GAP;
    const sy = CONFIG.CELL_H + CONFIG.CELL_GAP;
    for (const p of particles) {
      if (!p.alive) continue;
      const worldCol = Math.floor(p.px / sx);
      const worldRow = Math.floor(p.py / sy);
      const localCol = worldCol - xOffset;
      if (localCol >= 0 && localCol < viewportCols && worldRow >= 0 && worldRow < viewportRows) {
        cells[worldRow * viewportCols + localCol].className = `cell ${cellClassFor(p.tileType)}`;
      }
    }
  }

  // 3b. Coin burst particles (gold cells flying out of the player)
  if (coinBurst && coinBurst.length) {
    const sx = CONFIG.CELL_W + CONFIG.CELL_GAP;
    const sy = CONFIG.CELL_H + CONFIG.CELL_GAP;
    for (const p of coinBurst) {
      if (!p.alive) continue;
      const worldCol = Math.floor(p.px / sx);
      const worldRow = Math.floor(p.py / sy);
      const localCol = worldCol - xOffset;
      if (localCol >= 0 && localCol < viewportCols && worldRow >= 0 && worldRow < viewportRows) {
        cells[worldRow * viewportCols + localCol].className = 'cell cell--coin';
      }
    }
  }

  // 4. Enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    const worldCol = Math.floor(e.x);
    const worldRow = Math.floor(e.y);
    const localCol = worldCol - xOffset;
    if (localCol >= 0 && localCol < viewportCols && worldRow >= 0 && worldRow < viewportRows) {
      cells[worldRow * viewportCols + localCol].className = `cell cell--${e.type}`;
    }
  }

  // 5. Player on top — flicker (skip render every other tick) while invulnerable
  if (player) {
    // (drawn after coin HUD below to stay on top of normal cells; HUD lives in
    // its own row/column slice and doesn't conflict with player position.)
  }
  if (player) {
    const flicker = player.invulnTime > 0 && Math.floor(player.invulnTime * 12) % 2 === 0;
    if (!flicker) {
      const worldCol = Math.floor(player.x);
      const worldRow = Math.floor(player.y);
      const localCol = worldCol - xOffset;
      if (localCol >= 0 && localCol < viewportCols && worldRow >= 0 && worldRow < viewportRows) {
        cells[worldRow * viewportCols + localCol].className = 'cell cell--player';
      }
    }
  }

  // 6. Coin HUD in top-right: [coin] [x] [tens] [ones]
  const hudStart = (viewportCols - 4);
  if (hudStart >= 0) {
    const tens = Math.floor((coins % 100) / 10);
    const ones = coins % 10;
    const c0 = cells[0 * viewportCols + hudStart];
    const c1 = cells[0 * viewportCols + hudStart + 1];
    const c2 = cells[0 * viewportCols + hudStart + 2];
    const c3 = cells[0 * viewportCols + hudStart + 3];
    c0.className = 'cell cell--coin';
    c1.className = 'cell cell--digit'; c1.textContent = 'x';
    c2.className = 'cell cell--digit'; c2.textContent = String(tens);
    c3.className = 'cell cell--digit'; c3.textContent = String(ones);
  }
}
