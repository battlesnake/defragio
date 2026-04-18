// Sonic-style coin burst — when the player loses coins, each one pops out
// of them with an upward + lateral velocity, then gravity drags it down
// and off the level. Lives in pixel space so the arcs look natural over
// the discrete grid.

import { CONFIG } from '../config.js';

const STRIDE_X = CONFIG.CELL_W + CONFIG.CELL_GAP;
const STRIDE_Y = CONFIG.CELL_H + CONFIG.CELL_GAP;

const SPAWN_SPEED_MIN = 60;
const SPAWN_SPEED_MAX = 130;
const SPAWN_ANGLE_RANGE = Math.PI * 0.7;  // ±63° from straight up
const GRAVITY = 220;                       // pixels/sec²
const TTL = 2.5;

export function spawnCoinBurst(playerX, playerY, count, sink) {
  const px = playerX * STRIDE_X;
  const py = playerY * STRIDE_Y;
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * SPAWN_ANGLE_RANGE;
    const speed = SPAWN_SPEED_MIN + Math.random() * (SPAWN_SPEED_MAX - SPAWN_SPEED_MIN);
    sink.push({
      px, py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alive: true,
      ttl: TTL,
    });
  }
}

export function tickCoinBurst(particles, dt, levelHeight) {
  if (!particles || particles.length === 0) return;
  const offBottom = (levelHeight + 5) * STRIDE_Y;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (!p.alive) continue;
    p.vy += GRAVITY * dt;
    p.px += p.vx * dt;
    p.py += p.vy * dt;
    p.ttl -= dt;
    if (p.ttl <= 0 || p.py > offBottom) p.alive = false;
  }
  // Compact (in-place)
  let w = 0;
  for (let i = 0; i < particles.length; i++) {
    if (particles[i].alive) {
      if (w !== i) particles[w] = particles[i];
      w++;
    }
  }
  particles.length = w;
}
