import { TILE, fromChar } from './tile.js';

export function loadLevel(raw) {
  const { id, name, cursorSpeed, width, height, grid, enemies = [], events = [] } = raw;
  if (grid.length !== height) {
    throw new Error(`Level ${id}: grid has ${grid.length} rows but height=${height}`);
  }
  const tiles = grid.map(row => {
    if (row.length !== width) {
      throw new Error(`Level ${id}: row width ${row.length} != ${width}`);
    }
    return [...row].map(fromChar);
  });

  let playerStart = null;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] === 'P') {
        playerStart = { row: r, col: c };
        tiles[r][c] = TILE.FREE;
      }
    }
  }
  if (!playerStart) throw new Error(`Level ${id}: no player start (P) found`);

  return { id, name, cursorSpeed, width, height, tiles, playerStart, enemies, events };
}
