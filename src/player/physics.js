import { CONFIG } from '../config.js';

export function applyGravity(player, dt) {
  if (player.onGround) {
    if (player.vy > 0) player.vy = 0;
    return;
  }
  player.vy += CONFIG.GRAVITY * dt;
}

export function integrate(player, dt) {
  player.x += player.vx * dt;
  player.y += player.vy * dt;
}

export function applyHorizontalIntent(player, intent, dt) {
  const accel = player.onGround ? CONFIG.MOVE_ACCEL_GROUND : CONFIG.MOVE_ACCEL_AIR;
  const target = intent * CONFIG.MOVE_SPEED;
  const delta = target - player.vx;
  const step = Math.sign(delta) * Math.min(Math.abs(delta), accel * dt);
  player.vx += step;
  if (intent !== 0) player.facing = intent;
}
