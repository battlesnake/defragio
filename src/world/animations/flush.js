// Toilet-flush vortex: each solid cell becomes a particle. Tangential
// kick to start spinning, radial pull-to-center, light drag. Particles
// drain when they reach the center. Renders by mapping each particle to
// its containing cell on the grid.

import { isSolid, TILE } from '../tile.js';
import { pauseDefrag, clearDefragOps } from '../defrag.js';
import { CONFIG } from '../../config.js';

// Tunable constants.
const PAUSE_BEFORE   = 1.0;
const KICKSTART      = 6.0;   // initial tangential velocity (cells/sec)
const TANGENTIAL_F   = 22;    // continuous tangential force
const RADIAL_F       = 4;     // continuous inward pull
const DRAG           = 0.6;
const DRAIN_RADIUS   = 0.7;
const Y_SCALE_FOR_DIST = (CONFIG.CELL_W + CONFIG.CELL_GAP) / (CONFIG.CELL_H + CONFIG.CELL_GAP);
// ^ cells are taller than wide; scale y when computing distance so the
//   vortex looks circular on screen rather than oval.

export function createFlush(level, center) {
  const particles = [];
  for (let r = 0; r < level.height; r++) {
    for (let c = 0; c < level.width; c++) {
      const t = level.tiles[r][c];
      if (!isSolid(t)) continue;
      const px = c + 0.5;
      const py = r + 0.5;
      // Tangential kick: perpendicular to (center - particle), CW from above
      const dx = center.x - px;
      const dy = (center.y - py) / Y_SCALE_FOR_DIST;
      const d = Math.max(0.3, Math.sqrt(dx * dx + dy * dy));
      const tx = -dy / d;
      const ty = dx / d;
      particles.push({
        x: px,
        y: py,
        vx: tx * KICKSTART,
        vy: ty * KICKSTART * Y_SCALE_FOR_DIST,
        tileType: t,
        alive: true,
      });
      level.tiles[r][c] = TILE.FREE;
    }
  }
  return { center, particles, t: 0, aliveCount: particles.length };
}

export function tickFlush(flush, dt) {
  flush.t += dt;
  if (flush.t < PAUSE_BEFORE) return;

  let alive = 0;
  for (const p of flush.particles) {
    if (!p.alive) continue;

    const dx = flush.center.x - p.x;
    const dyVisual = (flush.center.y - p.y) / Y_SCALE_FOR_DIST;
    const d = Math.max(0.3, Math.sqrt(dx * dx + dyVisual * dyVisual));
    const rx = dx / d;
    const ry = dyVisual / d;
    // CW tangential
    const tx = -ry;
    const ty = rx;

    // Closer = stronger pull, less swirl
    const distEffect = Math.min(1, 4 / d);
    const fr = RADIAL_F * (1 + 1.5 * distEffect);
    const ft = TANGENTIAL_F * (0.4 + 0.4 * distEffect);

    p.vx += (rx * fr + tx * ft) * dt;
    p.vy += (ry * fr + ty * ft) * dt * Y_SCALE_FOR_DIST;

    p.vx -= p.vx * DRAG * dt;
    p.vy -= p.vy * DRAG * dt;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (d < DRAIN_RADIUS) {
      p.alive = false;
    } else {
      alive++;
    }
  }
  flush.aliveCount = alive;
}

export function startFlushAnimation(game) {
  pauseDefrag(game.defrag);
  clearDefragOps(game.defrag);
  const center = { x: game.player.x, y: game.player.y };
  game.flush = createFlush(game.level, center);
  game.animationDoneAt = Infinity; // ends when aliveCount === 0
}

export function isFlushDone(game) {
  if (!game.flush) return true;
  if (game.flush.t < PAUSE_BEFORE) return false;
  return game.flush.aliveCount === 0;
}
