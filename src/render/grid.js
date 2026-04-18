import { cellClassFor } from '../world/tile.js';
import { cursorAtRow } from '../world/cursor.js';

// Creates a fixed pool of cells sized to viewport. Repaints by setting className.
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

  return {
    cells,
    viewportCols,
    viewportRows,
    cellWidth,
    cellHeight,
    grid,
  };
}

// Paints the visible window: tiles → cursor cells → enemies → player.
// Camera.x is integer (tile-snapped), no sub-pixel transform.
export function paintGrid(renderer, level, camera, cursor, enemies = [], player = null) {
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

  // 2. Cursor (one cell per row at floor(cursorAtRow))
  if (cursor) {
    for (let r = 0; r < cursor.height && r < viewportRows; r++) {
      const cursorWorldCol = Math.floor(cursorAtRow(cursor, r));
      const localCol = cursorWorldCol - xOffset;
      if (localCol >= 0 && localCol < viewportCols) {
        cells[r * viewportCols + localCol].className = 'cell cell--cursor';
      }
    }
  }

  // 3. Enemies (overwrite the cell at floor(e.x), floor(e.y))
  for (const e of enemies) {
    if (!e.alive) continue;
    const worldCol = Math.floor(e.x);
    const worldRow = Math.floor(e.y);
    const localCol = worldCol - xOffset;
    if (localCol >= 0 && localCol < viewportCols && worldRow >= 0 && worldRow < viewportRows) {
      cells[worldRow * viewportCols + localCol].className = `cell cell--${e.type}`;
    }
  }

  // 4. Player (always on top)
  if (player) {
    const worldCol = Math.floor(player.x);
    const worldRow = Math.floor(player.y);
    const localCol = worldCol - xOffset;
    if (localCol >= 0 && localCol < viewportCols && worldRow >= 0 && worldRow < viewportRows) {
      cells[worldRow * viewportCols + localCol].className = 'cell cell--player';
    }
  }
}
