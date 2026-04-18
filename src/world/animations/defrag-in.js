// Reverse of the death "read away" sweep: schedule write ops that paint
// the next level into the empty grid using red write tells. Each cell
// gets restored to its original tile type.

import { isSolid } from '../tile.js';
import { clearDefragOps, scheduleScriptedOp } from '../defrag.js';

const TELL_DUR = 0.22;
const STAGGER = 0.010;
const REST_AFTER = 0.4;

export function startDefragInAnimation(game) {
  clearDefragOps(game.defrag);
  const snapshot = game.tilesSnapshot;

  const cells = [];
  for (let r = 0; r < snapshot.length; r++) {
    for (let c = 0; c < snapshot[r].length; c++) {
      const t = snapshot[r][c];
      if (isSolid(t)) cells.push({ row: r, col: c, targetType: t });
    }
  }
  cells.sort((a, b) => a.col - b.col || a.row - b.row);

  let t = 0;
  for (const cell of cells) {
    scheduleScriptedOp(game.defrag, 'write', [cell], t, TELL_DUR);
    t += STAGGER;
  }
  game.animationDoneAt = game.t + t + TELL_DUR + REST_AFTER;
}
