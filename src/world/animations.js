// End-of-life animations rendered on the cell grid using the same
// read/write tell mechanic as the defrag operation.
//
//   startDeathAnimation: morph the level into "YOU LOSE" via reads/writes.
//   startWinAnimation:   spiral all solid cells inward to nothing.

import { TILE, isSolid } from './tile.js';
import { pauseDefrag, clearDefragOps, scheduleScriptedOp } from './defrag.js';

const GLYPH_W = 5;
const GLYPH_H = 7;
const GLYPH_GAP = 1;

const FONT = {
  ' ': [
    '.....', '.....', '.....', '.....', '.....', '.....', '.....',
  ],
  'Y': [
    'X...X', 'X...X', '.X.X.', '..X..', '..X..', '..X..', '..X..',
  ],
  'O': [
    '.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.',
  ],
  'U': [
    'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.',
  ],
  'L': [
    'X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX',
  ],
  'S': [
    '.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.',
  ],
  'E': [
    'XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX',
  ],
};

function textCells(text, level, originRow, originCol) {
  const cells = new Set();
  let xCursor = originCol;
  for (const ch of text) {
    const glyph = FONT[ch] || FONT[' '];
    for (let r = 0; r < GLYPH_H; r++) {
      for (let c = 0; c < GLYPH_W; c++) {
        if (glyph[r][c] === 'X') {
          const row = originRow + r;
          const col = xCursor + c;
          if (row >= 0 && row < level.height && col >= 0 && col < level.width) {
            cells.add(row * 10000 + col);
          }
        }
      }
    }
    xCursor += GLYPH_W + GLYPH_GAP;
  }
  return cells;
}

const DEATH_TEXT = 'YOU LOSE';
const DEATH_TELL_DUR = 0.30;
const DEATH_READ_STAGGER = 0.010;
const DEATH_WRITE_STAGGER = 0.014;
const DEATH_GAP_BEFORE_WRITES = 0.15;
const DEATH_ADMIRE_AFTER = 1.0;

export function startDeathAnimation(game) {
  pauseDefrag(game.defrag);
  clearDefragOps(game.defrag);

  const textWidth = DEATH_TEXT.length * GLYPH_W + (DEATH_TEXT.length - 1) * GLYPH_GAP;
  const textRow0  = Math.floor((game.level.height - GLYPH_H) / 2);
  const textCol0  = Math.floor((game.level.width  - textWidth) / 2);
  const target    = textCells(DEATH_TEXT, game.level, textRow0, textCol0);

  const writes = [];
  const reads  = [];
  for (let r = 0; r < game.level.height; r++) {
    for (let c = 0; c < game.level.width; c++) {
      const wantSolid = target.has(r * 10000 + c);
      const isCurSolid = isSolid(game.level.tiles[r][c]);
      if (wantSolid && !isCurSolid) writes.push({ row: r, col: c });
      if (!wantSolid && isCurSolid) reads.push({ row: r, col: c });
    }
  }

  // Reads sweep left-to-right (defrag eating the existing terrain).
  reads.sort((a, b) => a.col - b.col || a.row - b.row);
  // Writes paint left-to-right too (text appearing).
  writes.sort((a, b) => a.col - b.col || a.row - b.row);

  let t = 0;
  for (const cell of reads) {
    scheduleScriptedOp(game.defrag, 'read', [cell], t, DEATH_TELL_DUR);
    t += DEATH_READ_STAGGER;
  }
  t += DEATH_GAP_BEFORE_WRITES;
  for (const cell of writes) {
    scheduleScriptedOp(game.defrag, 'write', [cell], t, DEATH_TELL_DUR);
    t += DEATH_WRITE_STAGGER;
  }

  game.animationDoneAt = game.t + t + DEATH_TELL_DUR + DEATH_ADMIRE_AFTER;
}

const WIN_PAUSE_BEFORE = 1.4;
const WIN_TELL_DUR = 0.22;
const WIN_STAGGER = 0.008;
const WIN_REST_AFTER = 1.0;

export function startWinAnimation(game) {
  pauseDefrag(game.defrag);
  clearDefragOps(game.defrag);

  const w = game.level.width;
  const h = game.level.height;

  // Build a clockwise spiral path from outside to center.
  const path = [];
  let r0 = 0, r1 = h - 1, c0 = 0, c1 = w - 1;
  while (r0 <= r1 && c0 <= c1) {
    for (let c = c0; c <= c1; c++) path.push({ row: r0, col: c });
    r0++;
    for (let r = r0; r <= r1; r++) path.push({ row: r, col: c1 });
    c1--;
    if (r0 <= r1) {
      for (let c = c1; c >= c0; c--) path.push({ row: r1, col: c });
      r1--;
    }
    if (c0 <= c1) {
      for (let r = r1; r >= r0; r--) path.push({ row: r, col: c0 });
      c0++;
    }
  }

  let t = WIN_PAUSE_BEFORE;
  for (const cell of path) {
    if (!isSolid(game.level.tiles[cell.row][cell.col])) continue;
    scheduleScriptedOp(game.defrag, 'read', [cell], t, WIN_TELL_DUR);
    t += WIN_STAGGER;
  }

  game.animationDoneAt = game.t + t + WIN_TELL_DUR + WIN_REST_AFTER;
}
