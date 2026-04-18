import { cellClassFor } from '../world/tile.js';

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

// Paints the visible window of the level given the camera offset.
export function paintGrid(renderer, level, camera) {
  const { cells, viewportCols, viewportRows } = renderer;
  const xOffset = Math.floor(camera.x);
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
  const subPx = (camera.x - xOffset) * (renderer.cellWidth + 1);
  renderer.grid.style.transform = `translateX(${-subPx}px)`;
}
