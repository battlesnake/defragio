import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyGravity, integrate, applyHorizontalIntent } from '../../src/player/physics.js';
import { CONFIG } from '../../src/config.js';

function p({ vy = 0, onGround = false, vx = 0 } = {}) {
  return { x: 0, y: 0, vx, vy, onGround, jumping: false, width: 1, height: 1 };
}

test('applyGravity: vy increases by g*dt when not on ground', () => {
  const player = p({ onGround: false });
  applyGravity(player, 0.1);
  assert.equal(player.vy, CONFIG.GRAVITY * 0.1);
});

test('applyGravity: no-op when on ground', () => {
  const player = p({ onGround: true });
  applyGravity(player, 0.1);
  assert.equal(player.vy, 0);
});

test('integrate moves position by velocity * dt', () => {
  const player = p({ vx: 5, vy: 2 });
  integrate(player, 0.1);
  assert.equal(player.x, 0.5);
  assert.equal(player.y, 0.2);
});

test('applyHorizontalIntent accelerates toward target speed', () => {
  const player = p({ onGround: true });
  applyHorizontalIntent(player, +1, 0.1);
  assert.equal(player.vx, Math.min(CONFIG.MOVE_ACCEL_GROUND * 0.1, CONFIG.MOVE_SPEED));
});

test('applyHorizontalIntent decelerates when no input', () => {
  const player = p({ onGround: true, vx: 5 });
  applyHorizontalIntent(player, 0, 0.1);
  assert.ok(Math.abs(player.vx) < 5);
});
