// Death-text morph animations on the cell grid.
//
//   startGameOverAnimation: full "YOU LOSE" — only when lives run out.
//   startQuickDeathAnimation: a brief LOL/LMAO/ЛОЛ/ЛМАО between lives.

import { isSolid } from '../tile.js';
import { pauseDefrag, clearDefragOps, scheduleScriptedOp } from '../defrag.js';
import { FONT, GLYPH_W, GLYPH_H, GLYPH_GAP } from './font.js';

const QUICK_TEXTS = ['LOL', 'LMAO', 'ЛОЛ', 'ЛМАО', 'DVBYB'];

const FULL_TIMING = {
  tellDur: 0.30,
  readStagger: 0.010,
  writeStagger: 0.014,
  gapBeforeWrites: 0.15,
  admire: 1.0,
};

const QUICK_TIMING = {
  tellDur: 0.10,
  readStagger: 0.0035,
  writeStagger: 0.005,
  gapBeforeWrites: 0.05,
  admire: 0.35,
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

function runTextMorph(game, camera, text, t) {
  pauseDefrag(game.defrag);
  clearDefragOps(game.defrag);

  const charCount = [...text].length;
  const textWidth = charCount * GLYPH_W + (charCount - 1) * GLYPH_GAP;
  const textRow0  = Math.floor((game.level.height - GLYPH_H) / 2);
  const camX  = camera ? camera.x : 0;
  const camW  = camera ? camera.viewportCols : game.level.width;
  let textCol0 = camX + Math.floor((camW - textWidth) / 2);
  textCol0 = Math.max(0, Math.min(game.level.width - textWidth, textCol0));
  const target = textCells(text, game.level, textRow0, textCol0);

  const writes = [];
  const reads  = [];
  for (let r = 0; r < game.level.height; r++) {
    for (let c = 0; c < game.level.width; c++) {
      const wantSolid  = target.has(r * 10000 + c);
      const isCurSolid = isSolid(game.level.tiles[r][c]);
      if (wantSolid && !isCurSolid) writes.push({ row: r, col: c });
      if (!wantSolid && isCurSolid) reads.push({ row: r, col: c });
    }
  }

  reads.sort((a, b) => a.col - b.col || a.row - b.row);
  writes.sort((a, b) => a.col - b.col || a.row - b.row);

  let when = 0;
  for (const cell of reads) {
    scheduleScriptedOp(game.defrag, 'read', [cell], when, t.tellDur);
    when += t.readStagger;
  }
  when += t.gapBeforeWrites;
  for (const cell of writes) {
    scheduleScriptedOp(game.defrag, 'write', [cell], when, t.tellDur);
    when += t.writeStagger;
  }

  game.animationDoneAt = game.t + when + t.tellDur + t.admire;
}

export function startGameOverAnimation(game, camera) {
  runTextMorph(game, camera, 'YOU LOSE', FULL_TIMING);
}

export function startQuickDeathAnimation(game, camera) {
  const text = QUICK_TEXTS[Math.floor(Math.random() * QUICK_TEXTS.length)];
  runTextMorph(game, camera, text, QUICK_TIMING);
}
