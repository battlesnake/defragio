import { TILE, isVolatileSolid } from './tile.js';
import { CONFIG } from '../config.js';

// The defrag operation. Scheduling-based, not a moving wave:
//   - A "front" advances rightward at level.cursorSpeed.
//   - Periodically schedules read ops (contiguous solid → free, with green tell)
//     ahead of the front, and write ops (contiguous free → solid, with red tell)
//     near the front. After ~1s the cell change applies.
//   - Player dies if front reaches their column.

const READ_DURATION  = 1.0;
const WRITE_DURATION = 1.0;
const OP_INTERVAL_MIN = 0.18;
const OP_INTERVAL_MAX = 0.42;
const BAND_AHEAD = 12;
const BAND_BEHIND = 1;
const READ_BIAS_AHEAD = 6;   // reads prefer cells this far ahead of front
const WRITE_BIAS_AT_FRONT = 2;

function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function createDefrag({ levelId, level, speed, initialOffset = 0 }) {
  const seed = (CONFIG.CURSOR_SEED_BASE + levelId) >>> 0;
  return {
    front: -initialOffset,
    speed,
    level,
    levelId,
    t: 0,
    ops: [],
    nextOpAt: 0.05,
    rng: makeRng(seed),
  };
}

export function advanceDefrag(defrag, dt) {
  defrag.front += defrag.speed * dt;
  defrag.t += dt;

  // Apply completed ops (mutate the level)
  for (const op of defrag.ops) {
    if (!op.applied && defrag.t >= op.completeAt) {
      for (const { row, col } of op.cells) {
        defrag.level.tiles[row][col] = (op.type === 'read') ? TILE.FREE : TILE.CYAN_SOLID;
      }
      op.applied = true;
    }
  }
  // Drop ops shortly after completion
  defrag.ops = defrag.ops.filter(op => !op.applied || defrag.t < op.completeAt + 0.15);

  // Schedule new ops while we're due
  while (defrag.t >= defrag.nextOpAt) {
    scheduleOp(defrag);
    defrag.nextOpAt = defrag.t + OP_INTERVAL_MIN + defrag.rng() * (OP_INTERVAL_MAX - OP_INTERVAL_MIN);
  }
}

function scheduleOp(defrag) {
  const { level, front, rng } = defrag;
  const isRead = rng() < 0.55;
  const row = Math.floor(rng() * level.height);

  const bandLeft  = Math.max(0, Math.floor(front) - BAND_BEHIND);
  const bandRight = Math.min(level.width - 1, Math.floor(front) + BAND_AHEAD);
  if (bandRight <= bandLeft) return;

  // Bias starting column toward read-ahead vs write-at-front
  const bias = isRead ? READ_BIAS_AHEAD : WRITE_BIAS_AT_FRONT;
  const center = Math.floor(front) + bias;
  const startCol = clamp(center + Math.floor((rng() - 0.5) * 6), bandLeft, bandRight);
  const maxLen = 3 + Math.floor(rng() * 4);

  const cells = [];
  for (let c = startCol; c < startCol + maxLen && c <= bandRight; c++) {
    if (c < 0) continue;
    const tile = level.tiles[row][c];
    if (isRead) {
      if (isVolatileSolid(tile)) cells.push({ row, col: c });
      else break;
    } else {
      if (tile === TILE.FREE) cells.push({ row, col: c });
      else break;
    }
  }

  if (cells.length === 0) return;

  defrag.ops.push({
    type: isRead ? 'read' : 'write',
    cells,
    scheduledAt: defrag.t,
    completeAt: defrag.t + (isRead ? READ_DURATION : WRITE_DURATION),
    applied: false,
  });
}

const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

// Returns 'read' | 'write' | null for a cell currently being processed.
export function defragOpAt(defrag, row, col) {
  for (const op of defrag.ops) {
    if (op.applied) continue;
    for (const c of op.cells) {
      if (c.row === row && c.col === col) return op.type;
    }
  }
  return null;
}
