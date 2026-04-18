import { CONFIG } from '../config.js';
import { makeRowPhases, rowOffset } from '../util/noise.js';

export function createCursor({ levelId, height, speed }) {
  const seed = (CONFIG.CURSOR_SEED_BASE + levelId) >>> 0;
  return {
    baseX: 0,
    speed,
    height,
    t: 0,
    phases: makeRowPhases(seed, height),
  };
}

export function advanceCursor(cursor, dt) {
  cursor.baseX += cursor.speed * dt;
  cursor.t += dt;
}

export function cursorAtRow(cursor, row) {
  return cursor.baseX + rowOffset(row, cursor.t, cursor.phases);
}

export function cursorMean(cursor) {
  let sum = 0;
  for (let r = 0; r < cursor.height; r++) sum += cursorAtRow(cursor, r);
  return sum / cursor.height;
}
