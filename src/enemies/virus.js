import { isSolid } from '../world/tile.js';

const VIRUS_SPEED = 2.5;   // cells/sec
const GRAVITY     = 60;    // cells/sec^2

export function createVirus(spec) {
  const { cell, patrol } = spec;
  return {
    type: 'virus',
    x: cell.col + 0.5,
    y: cell.row + 0.5,
    vx: VIRUS_SPEED,
    vy: 0,
    width: 1, height: 1,
    patrolFrom: patrol.from,
    patrolTo: patrol.to,
    onGround: false,
    alive: true,
  };
}

// `level` is optional — when given, applies gravity, drops the virus when
// the floor under it disappears, and stops the virus from walking off
// ledges (turns around) or through walls.
export function tickVirus(v, dt, level) {
  if (!v.alive) return;

  if (level) {
    // Gravity + vertical integration
    v.vy += GRAVITY * dt;
    v.y  += v.vy * dt;

    // Floor under feet
    const cellCol  = Math.floor(v.x);
    const belowRow = Math.floor(v.y + 0.5 + 0.01);
    if (
      belowRow >= 0 && belowRow < level.height &&
      cellCol  >= 0 && cellCol  < level.width &&
      isSolid(level.tiles[belowRow][cellCol])
    ) {
      v.y = belowRow - 0.5;
      v.vy = 0;
      v.onGround = true;
    } else {
      v.onGround = false;
    }

    // Fell off the bottom of the level
    if (v.y > level.height + 2) {
      v.alive = false;
      return;
    }
  }

  // Horizontal integration
  v.x += v.vx * dt;

  // Patrol bounds (always apply)
  if (v.x > v.patrolTo + 0.5)        v.vx = -VIRUS_SPEED;
  else if (v.x < v.patrolFrom + 0.5) v.vx =  VIRUS_SPEED;

  // Wall / ledge check — only meaningful when on ground.
  if (level && v.onGround) {
    const dir       = Math.sign(v.vx) || 1;
    const aheadCol  = Math.floor(v.x + dir * 0.5);
    const cellRow   = Math.floor(v.y);
    const belowRow  = Math.floor(v.y + 0.5 + 0.01);
    const aheadInBounds = aheadCol >= 0 && aheadCol < level.width;
    if (aheadInBounds && cellRow >= 0 && cellRow < level.height) {
      // Wall at the virus's height — turn around
      if (isSolid(level.tiles[cellRow][aheadCol])) {
        v.vx = -v.vx;
      }
      // No floor ahead — turn around (don't walk off ledge)
      else if (
        belowRow >= 0 && belowRow < level.height &&
        !isSolid(level.tiles[belowRow][aheadCol])
      ) {
        v.vx = -v.vx;
      }
    }
  }
}
