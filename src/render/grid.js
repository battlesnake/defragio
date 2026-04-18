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

// Paint order: tiles → defrag op tells → flush particles → enemies → player.
// Each particle maps to its containing cell (floor(x), floor(y)); when two
// particles occupy the same cell, the one written later wins.
export function paintGrid(renderer, level, camera, defrag, enemies = [], player = null, particles = null) {
  const { cells, viewportCols, viewportRows } = renderer;
  const xOffset = camera.x;

  // 1. Base tiles
  for (let r = 0; r < viewportRows; r++) {
    for (let c = 0; c < viewportCols; c++) {
      const worldCol = xOffset + c;
      let tileClass = 'cell--free';
      if (r >= 0 && r < level.height && worldCol >= 0 && worldCol < level.width) {
        tileClass = cellClassFor(level.tiles[r][worldCol]);
      }
      cells[r * viewportCols + c].className = `cell ${tileClass}`;
    }
  }

  // 2b. Defrag front (red-bordered dark column at the leading edge)
  if (defrag && defrag.front >= 0) {
    const frontCol = Math.floor(defrag.front);
    const localFront = frontCol - xOffset;
    if (localFront >= 0 && localFront < viewportCols) {
      for (let r = 0; r < viewportRows; r++) {
        cells[r * viewportCols + localFront].className = 'cell cell--front';
      }
    }
  }
  // 2c. Defrag op tells (read/write flashes; on top of front/consumed)
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

  // 5. Player on top
  if (player) {
    const worldCol = Math.floor(player.x);
    const worldRow = Math.floor(player.y);
    const localCol = worldCol - xOffset;
    if (localCol >= 0 && localCol < viewportCols && worldRow >= 0 && worldRow < viewportRows) {
      cells[worldRow * viewportCols + localCol].className = 'cell cell--player';
    }
  }
}
