// Toilet-flush vortex.
//
// Each solid cell becomes a particle in PIXEL space (so the vortex looks
// circular on screen even though cells are taller than wide). At spawn,
// every particle gets the orbital velocity that exactly balances the
// initial radial force at its distance — so without any further input it
// would just sit in a stable circular orbit.
//
// Then the radial force grows exponentially over the next 3 seconds.
// Orbits collapse, particles spiral inward, drain at the center. After
// MAX_DURATION any survivors are killed. Total animation length is
// PAUSE_BEFORE + MAX_DURATION (1s + 3s = 4s).

import { isSolid, TILE } from '../tile.js';
import { pauseDefrag, clearDefragOps } from '../defrag.js';
import { CONFIG } from '../../config.js';

const STRIDE_X = CONFIG.CELL_W + CONFIG.CELL_GAP;  // 11
const STRIDE_Y = CONFIG.CELL_H + CONFIG.CELL_GAP;  // 15

const PAUSE_BEFORE = 1.0;
const MAX_DURATION = 3.0;
const BASE_RADIAL  = 30;    // initial inward force (px/sec²) — used for orbital v match
const FORCE_GROWTH = 8.0;   // multiplier per second (exp): t=3 → 8^3 = 512×
const DRAG         = 1.0;
const DRAIN_RADIUS = STRIDE_X * 0.7;
const MIN_DIST     = STRIDE_X * 0.4;

export function createFlush(level, center) {
  const cx = center.x * STRIDE_X;
  const cy = center.y * STRIDE_Y;

  const particles = [];
  for (let r = 0; r < level.height; r++) {
    for (let c = 0; c < level.width; c++) {
      const t = level.tiles[r][c];
      if (!isSolid(t)) continue;
      const px = (c + 0.5) * STRIDE_X;
      const py = (r + 0.5) * STRIDE_Y;
      const dx = cx - px;
      const dy = cy - py;
      const d = Math.max(MIN_DIST, Math.sqrt(dx * dx + dy * dy));
      // CW tangential unit vector
      const tx = -dy / d;
      const ty =  dx / d;
      // Orbital velocity for stable circular orbit: v² / r = a → v = √(a · r)
      const v = Math.sqrt(BASE_RADIAL * d);
      particles.push({
        px, py,
        vx: tx * v,
        vy: ty * v,
        tileType: t,
        alive: true,
      });
      level.tiles[r][c] = TILE.FREE;
    }
  }
  return { center: { x: cx, y: cy }, particles, t: 0, aliveCount: particles.length };
}

export function tickFlush(flush, dt) {
  flush.t += dt;
  if (flush.t < PAUSE_BEFORE) return;

  const phaseT = flush.t - PAUSE_BEFORE;
  if (phaseT >= MAX_DURATION) {
    for (const p of flush.particles) p.alive = false;
    flush.aliveCount = 0;
    return;
  }

  const inwardForce = BASE_RADIAL * Math.pow(FORCE_GROWTH, phaseT);

  let alive = 0;
  for (const p of flush.particles) {
    if (!p.alive) continue;

    const dx = flush.center.x - p.px;
    const dy = flush.center.y - p.py;
    const d  = Math.max(MIN_DIST, Math.sqrt(dx * dx + dy * dy));
    const rx = dx / d;
    const ry = dy / d;

    p.vx += rx * inwardForce * dt;
    p.vy += ry * inwardForce * dt;

    p.vx -= p.vx * DRAG * dt;
    p.vy -= p.vy * DRAG * dt;

    p.px += p.vx * dt;
    p.py += p.vy * dt;

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
  game.flush = createFlush(game.level, { x: game.player.x, y: game.player.y });
  game.animationDoneAt = Infinity; // ends when isFlushDone() is true
}

export function isFlushDone(game) {
  if (!game.flush) return true;
  if (game.flush.t < PAUSE_BEFORE) return false;
  if (game.flush.t - PAUSE_BEFORE >= MAX_DURATION) return true;
  return game.flush.aliveCount === 0;
}
