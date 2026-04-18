// "YOU LOSE" defrag-style morph: read existing terrain away, write the
// text in. Driven by the existing defrag scripted-op mechanism.

import { isSolid } from '../tile.js';
import { pauseDefrag, clearDefragOps, scheduleScriptedOp } from '../defrag.js';
import { FONT, GLYPH_W, GLYPH_H, GLYPH_GAP } from './font.js';

const TEXT = 'YOU LOSE';
const TELL_DUR = 0.30;
const READ_STAGGER = 0.010;
const WRITE_STAGGER = 0.014;
const GAP_BEFORE_WRITES = 0.15;
const ADMIRE_AFTER = 1.0;

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

export function startDeathAnimation(game) {
  pauseDefrag(game.defrag);
  clearDefragOps(game.defrag);

  const textWidth = TEXT.length * GLYPH_W + (TEXT.length - 1) * GLYPH_GAP;
  const textRow0  = Math.floor((game.level.height - GLYPH_H) / 2);
  const textCol0  = Math.floor((game.level.width  - textWidth) / 2);
  const target    = textCells(TEXT, game.level, textRow0, textCol0);

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

  reads.sort((a, b) => a.col - b.col || a.row - b.row);
  writes.sort((a, b) => a.col - b.col || a.row - b.row);

  let t = 0;
  for (const cell of reads) {
    scheduleScriptedOp(game.defrag, 'read', [cell], t, TELL_DUR);
    t += READ_STAGGER;
  }
  t += GAP_BEFORE_WRITES;
  for (const cell of writes) {
    scheduleScriptedOp(game.defrag, 'write', [cell], t, TELL_DUR);
    t += WRITE_STAGGER;
  }

  game.animationDoneAt = game.t + t + TELL_DUR + ADMIRE_AFTER;
}
