import { CONFIG } from '../config.js';

export function startJump(player) {
  player.vy = CONFIG.JUMP_VELOCITY;
  player.onGround = false;
  player.jumping = true;
}

export function releaseJump(player) {
  if (!player.jumping) return;
  player.jumping = false;
  if (player.vy < CONFIG.JUMP_CUT_VELOCITY) {
    player.vy = CONFIG.JUMP_CUT_VELOCITY;
  }
}
