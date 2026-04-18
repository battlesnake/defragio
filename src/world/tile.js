export const TILE = Object.freeze({
  FREE: 0,
  CYAN_SOLID: 1,
  CYAN_DIAG: 2,
  CYAN_DOTS: 3,
  OPT: 4,
  SYS: 5,
  BAD: 6,
  CHECKPOINT: 7,
  FRAGILE: 8,
  GOAL: 9,
  COIN: 10,
});

const SOLID = new Set([
  TILE.CYAN_SOLID, TILE.CYAN_DIAG, TILE.CYAN_DOTS,
  TILE.OPT, TILE.SYS, TILE.FRAGILE, TILE.BAD,
]);

const LETHAL = new Set([TILE.BAD]);

export const isSolid  = (t) => SOLID.has(t);
export const isLethal = (t) => LETHAL.has(t);

// Cells that the defrag operation will read/relocate (i.e. mutable terrain).
const VOLATILE = new Set([
  TILE.CYAN_SOLID, TILE.CYAN_DIAG, TILE.CYAN_DOTS, TILE.OPT,
]);
export const isVolatileSolid = (t) => VOLATILE.has(t);

const CHAR_TO_TILE = {
  '.': TILE.FREE,
  '~': TILE.CYAN_SOLID,
  ':': TILE.CYAN_DIAG,
  "'": TILE.CYAN_DOTS,
  'O': TILE.OPT,
  'Y': TILE.SYS,
  'B': TILE.BAD,
  'C': TILE.CHECKPOINT,
  'F': TILE.FRAGILE,
  'G': TILE.GOAL,
  '$': TILE.COIN,
};

export const fromChar = (ch) => {
  const t = CHAR_TO_TILE[ch];
  if (t === undefined) return TILE.FREE;
  return t;
};

const TILE_TO_CLASS = {
  [TILE.FREE]: 'cell--free',
  [TILE.CYAN_SOLID]: 'cell--cyan-solid',
  [TILE.CYAN_DIAG]: 'cell--cyan-diag',
  [TILE.CYAN_DOTS]: 'cell--cyan-dots',
  [TILE.OPT]: 'cell--opt',
  [TILE.SYS]: 'cell--sys',
  [TILE.BAD]: 'cell--bad',
  [TILE.CHECKPOINT]: 'cell--checkpoint',
  [TILE.FRAGILE]: 'cell--fragile',
  [TILE.GOAL]: 'cell--goal',
  [TILE.COIN]: 'cell--coin',
};

export const cellClassFor = (t) => TILE_TO_CLASS[t] || 'cell--free';

export const isCheckpoint = (t) => t === TILE.CHECKPOINT;
export const isGoal       = (t) => t === TILE.GOAL;
export const isCoin       = (t) => t === TILE.COIN;
