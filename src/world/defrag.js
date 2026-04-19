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

// Backfill: cells far behind the front fill in over time. Rate grows with
// game time so eventually the entire back of the disk reaches density 1.
// Player who backtracks too far gets crushed.
const BACKFILL_RATE_BASE   = 1.0;   // writes per second at t=0
const BACKFILL_RATE_GROWTH = 0.06;  // exponential coefficient (per second)
const BACKFILL_OFFSET      = 4;     // cells behind front to start filling

// Top-hat filler: a sliding window of "where random writes can spawn" that
// starts pinned to column 0 and crawls rightwards after a short delay.
// Result: the leftmost columns fill up first, then the dense zone follows
// toward the right over time. Independent from (and slower than) the front.
const TOPHAT_DELAY        = 2.5;    // seconds before the right edge starts crawling
const TOPHAT_WIDTH        = 10;     // columns
const TOPHAT_CRAWL_SPEED  = 1.6;    // columns per second
const TOPHAT_INTERVAL     = 0.40;   // seconds between spawn attempts
const TOPHAT_LEN_MIN      = 1;
const TOPHAT_LEN_MAX      = 5;
const TOPHAT_FRONT_BUFFER = 2;      // never spawn closer than this to the front

// Read top-hat: trails behind the write top-hat, eating away platforms
// (mostly the bottom rows) so a player who lingers at the back falls
// through the floor. A touch faster than the write wall — eventually it
// closes the gap and the back of the disk becomes pure churn.
const READ_TOPHAT_DELAY        = 7.0;   // seconds before this wall starts moving
const READ_TOPHAT_CRAWL_SPEED  = 2.0;   // columns per second
const READ_TOPHAT_WIDTH        = 10;
const READ_TOPHAT_INTERVAL     = 0.18;  // spawn attempts per second
const READ_TOPHAT_LEN_MIN      = 2;
const READ_TOPHAT_LEN_MAX      = 6;

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
    paused: false,
  };
}

// Stop random scheduling and front advancement (for animations).
export function pauseDefrag(defrag) {
  defrag.paused = true;
}

// Drop all pending random ops (call before injecting scripted ops).
export function clearDefragOps(defrag) {
  defrag.ops = [];
}

// Inject an op with a fixed start time (relative to "now").
export function scheduleScriptedOp(defrag, type, cells, delay, duration) {
  defrag.ops.push({
    type,
    cells,
    scheduledAt: defrag.t + delay,
    completeAt: defrag.t + delay + duration,
    applied: false,
  });
}

export function advanceDefrag(defrag, dt) {
  if (!defrag.paused) defrag.front += defrag.speed * dt;
  defrag.t += dt;

  // Apply ops whose tell phase is over (mutate the level)
  for (const op of defrag.ops) {
    if (!op.applied && defrag.t >= op.completeAt) {
      for (const c of op.cells) {
        if (op.type === 'read') {
          defrag.level.tiles[c.row][c.col] = TILE.FREE;
        } else {
          defrag.level.tiles[c.row][c.col] = c.targetType ?? TILE.CYAN_SOLID;
        }
      }
      op.applied = true;
    }
  }
  // Drop ops shortly after completion
  defrag.ops = defrag.ops.filter(op => !op.applied || defrag.t < op.completeAt + 0.15);

  if (defrag.paused) return;

  // Schedule new ops while we're due
  while (defrag.t >= defrag.nextOpAt) {
    scheduleOp(defrag);
    defrag.nextOpAt = defrag.t + OP_INTERVAL_MIN + defrag.rng() * (OP_INTERVAL_MAX - OP_INTERVAL_MIN);
  }

  // Backfill timer
  defrag.backfillT = (defrag.backfillT ?? 0) + dt;
  const rate = BACKFILL_RATE_BASE * Math.exp(BACKFILL_RATE_GROWTH * defrag.t);
  const interval = 1 / rate;
  while (defrag.backfillT >= interval) {
    defrag.backfillT -= interval;
    scheduleBackfill(defrag);
  }

  // Top-hat filler timer
  defrag.tophatT = (defrag.tophatT ?? 0) + dt;
  while (defrag.tophatT >= TOPHAT_INTERVAL) {
    defrag.tophatT -= TOPHAT_INTERVAL;
    scheduleTophatWrite(defrag);
  }

  // Read top-hat (trailing wall that eats lower-row platforms)
  defrag.tophatReadT = (defrag.tophatReadT ?? 0) + dt;
  while (defrag.tophatReadT >= READ_TOPHAT_INTERVAL) {
    defrag.tophatReadT -= READ_TOPHAT_INTERVAL;
    scheduleTophatRead(defrag);
  }
}

function scheduleTophatWrite(defrag) {
  const { level, front, rng, t } = defrag;
  const crawlT = Math.max(0, t - TOPHAT_DELAY);
  const frontCap = Math.max(0, Math.floor(front) - TOPHAT_FRONT_BUFFER);
  const right = Math.min(frontCap, Math.floor(crawlT * TOPHAT_CRAWL_SPEED));
  if (right < 0) return;
  const left = Math.max(0, right - TOPHAT_WIDTH + 1);
  if (right < left) return;

  const startCol = left + Math.floor(rng() * (right - left + 1));
  const row = Math.floor(rng() * level.height);
  const len = TOPHAT_LEN_MIN + Math.floor(rng() * (TOPHAT_LEN_MAX - TOPHAT_LEN_MIN + 1));

  const cells = [];
  for (let c = startCol; c < startCol + len && c < level.width; c++) {
    if (isCellBusy(defrag, row, c)) break;
    if (level.tiles[row][c] !== TILE.FREE) break;
    cells.push({ row, col: c });
  }
  if (cells.length === 0) return;

  defrag.ops.push({
    type: 'write',
    cells,
    scheduledAt: defrag.t,
    completeAt: defrag.t + WRITE_DURATION,
    applied: false,
  });
}

function scheduleTophatRead(defrag) {
  const { level, rng, t } = defrag;
  const crawlT = Math.max(0, t - READ_TOPHAT_DELAY);
  const right = Math.floor(crawlT * READ_TOPHAT_CRAWL_SPEED);
  if (right < 0) return;
  const left = Math.max(0, right - READ_TOPHAT_WIDTH + 1);
  if (right < left) return;

  const startCol = left + Math.floor(rng() * (right - left + 1));
  // Bias hard toward bottom rows: 1 - rng()³ peaks sharply near 1, so the
  // chosen row index sits in the bottom of the level most of the time.
  const u = rng();
  const row = Math.min(level.height - 1, Math.floor((1 - u * u * u) * level.height));
  const len = READ_TOPHAT_LEN_MIN + Math.floor(rng() * (READ_TOPHAT_LEN_MAX - READ_TOPHAT_LEN_MIN + 1));

  const cells = [];
  for (let c = startCol; c < startCol + len && c < level.width; c++) {
    if (isCellBusy(defrag, row, c)) break;
    if (!isVolatileSolid(level.tiles[row][c])) break;
    cells.push({ row, col: c });
  }
  if (cells.length === 0) return;

  defrag.ops.push({
    type: 'read',
    cells,
    scheduledAt: defrag.t,
    completeAt: defrag.t + READ_DURATION,
    applied: false,
  });
}

function scheduleBackfill(defrag) {
  const { level, front, rng } = defrag;
  const right = Math.max(0, Math.floor(front) - BACKFILL_OFFSET);
  if (right <= 0) return;
  // Random free cell in [0, right)
  const col = Math.floor(rng() * right);
  const row = Math.floor(rng() * level.height);
  if (level.tiles[row][col] !== TILE.FREE) return;
  if (isCellBusy(defrag, row, col)) return;
  defrag.ops.push({
    type: 'write',
    cells: [{ row, col }],
    scheduledAt: defrag.t,
    completeAt: defrag.t + WRITE_DURATION,
    applied: false,
  });
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
    if (isCellBusy(defrag, row, c)) break;
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

// True if any pending (not-yet-applied) op already claims this cell.
// Schedulers consult this so two concurrent ops never share a cell —
// otherwise the read/write tells flicker against each other and the
// final mutation order becomes unpredictable.
function isCellBusy(defrag, row, col) {
  for (const op of defrag.ops) {
    if (op.applied) continue;
    for (const c of op.cells) {
      if (c.row === row && c.col === col) return true;
    }
  }
  return false;
}

// Returns 'read' | 'write' | null for a cell currently being processed.
// Only counts ops whose tell phase has started (scheduledAt has passed).
export function defragOpAt(defrag, row, col) {
  for (const op of defrag.ops) {
    if (op.applied) continue;
    if (defrag.t < op.scheduledAt) continue;
    for (const c of op.cells) {
      if (c.row === row && c.col === col) return op.type;
    }
  }
  return null;
}
