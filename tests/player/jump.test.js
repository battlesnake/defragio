import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startJump, releaseJump } from '../../src/player/jump.js';
import { CONFIG } from '../../src/config.js';

test('startJump sets vy to JUMP_VELOCITY and marks jumping', () => {
  const player = { vy: 0, onGround: true, jumping: false };
  startJump(player);
  assert.equal(player.vy, CONFIG.JUMP_VELOCITY);
  assert.equal(player.onGround, false);
  assert.equal(player.jumping, true);
});

test('releaseJump caps upward velocity (variable-height jump)', () => {
  const player = { vy: -22, jumping: true };
  releaseJump(player);
  assert.equal(player.vy, CONFIG.JUMP_CUT_VELOCITY);
  assert.equal(player.jumping, false);
});

test('releaseJump no-op if already falling', () => {
  const player = { vy: 5, jumping: true };
  releaseJump(player);
  assert.equal(player.vy, 5);
  assert.equal(player.jumping, false);
});

test('releaseJump no-op if not jumping', () => {
  const player = { vy: -22, jumping: false };
  releaseJump(player);
  assert.equal(player.vy, -22);
});
