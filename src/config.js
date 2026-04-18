// All gameplay-tunable constants live here. Values in cells/sec or cells/sec^2.
export const CONFIG = {
  CELL_W: 10,
  CELL_H: 14,
  CELL_GAP: 1,

  MOVE_SPEED:        8,
  MOVE_ACCEL_GROUND: 50,
  MOVE_ACCEL_AIR:    25,
  GRAVITY:           60,

  JUMP_VELOCITY:     -22,
  JUMP_CUT_VELOCITY: -8,

  CURSOR_SEED_BASE:  100,
  CURSOR_NUM_ROWS_DEFAULT: 16,

  VIEWPORT_COLS: 50,
};
