// Two-phase finale animation when the last level is beaten:
//   Phase 1: every cell flips to OPT (solid blue) sweeping left-to-right —
//            "the disk is fully defragmented".
//   Phase 2: read away every non-text cell, leaving "YOU WIN" as a blue
//            silhouette on white background.

import { TILE, isSolid } from '../tile.js';
import { pauseDefrag, clearDefragOps, scheduleScriptedOp } from '../defrag.js';
import { FONT, GLYPH_W, GLYPH_H, GLYPH_GAP } from './font.js';

const PHASE1_TELL_DUR = 0.18;
const PHASE1_STAGGER = 0.005;
const PHASE_GAP = 0.5;
const PHASE2_TELL_DUR = 0.14;
const PHASE2_STAGGER = 0.0025;
const FINAL_HOLD = 2.0;

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

export function startFinalWinAnimation(game, camera) {
  pauseDefrag(game.defrag);
  clearDefragOps(game.defrag);

  // Phase 1: write OPT (blue) to every cell, sweeping right
  const allCells = [];
  for (let r = 0; r < game.level.height; r++) {
    for (let c = 0; c < game.level.width; c++) {
      allCells.push({ row: r, col: c, targetType: TILE.OPT });
    }
  }
  allCells.sort((a, b) => a.col - b.col || a.row - b.row);

  let when = 0;
  for (const cell of allCells) {
    scheduleScriptedOp(game.defrag, 'write', [cell], when, PHASE1_TELL_DUR);
    when += PHASE1_STAGGER;
  }

  // Pause, then phase 2
  when += PHASE_GAP;

  const text = 'YOU WIN';
  const charCount = [...text].length;
  const textWidth = charCount * GLYPH_W + (charCount - 1) * GLYPH_GAP;
  const textRow0 = Math.floor((game.level.height - GLYPH_H) / 2);
  const camX = camera ? camera.x : 0;
  const camW = camera ? camera.viewportCols : game.level.width;
  let textCol0 = camX + Math.floor((camW - textWidth) / 2);
  textCol0 = Math.max(0, Math.min(game.level.width - textWidth, textCol0));
  const targetCells = textCells(text, game.level, textRow0, textCol0);

  const reads = [];
  for (let r = 0; r < game.level.height; r++) {
    for (let c = 0; c < game.level.width; c++) {
      if (!targetCells.has(r * 10000 + c)) reads.push({ row: r, col: c });
    }
  }
  reads.sort((a, b) => a.col - b.col || a.row - b.row);

  for (const cell of reads) {
    scheduleScriptedOp(game.defrag, 'read', [cell], when, PHASE2_TELL_DUR);
    when += PHASE2_STAGGER;
  }

  game.animationDoneAt = game.t + when + PHASE2_TELL_DUR + FINAL_HOLD;
}
