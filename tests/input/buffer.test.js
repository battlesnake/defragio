import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJumpBuffer, recordJumpPress, tickBuffer, recordLeftGround, canJump } from '../../src/input/buffer.js';

test('canJump returns true when on ground and jump pressed this frame', () => {
  const buf = createJumpBuffer();
  recordJumpPress(buf, 1.0);
  assert.equal(canJump(buf, 1.0, true), true);
});

test('jump buffer remembers a press for ~80ms before landing', () => {
  const buf = createJumpBuffer();
  recordJumpPress(buf, 1.0);
  // No ground, no coyote, no air jumps left → cannot jump
  assert.equal(canJump(buf, 1.0, false, 1), false);
  assert.equal(canJump(buf, 1.06, true, 1), true);
});

test('jump buffer expires after window', () => {
  const buf = createJumpBuffer();
  recordJumpPress(buf, 1.0);
  assert.equal(canJump(buf, 1.2, true), false);
});

test('coyote time allows jump shortly after leaving ground', () => {
  const buf = createJumpBuffer();
  recordLeftGround(buf, 1.0);
  recordJumpPress(buf, 1.05);
  assert.equal(canJump(buf, 1.05, false), true);
});

test('coyote time expires', () => {
  const buf = createJumpBuffer();
  recordLeftGround(buf, 1.0);
  recordJumpPress(buf, 1.2);
  // No ground, coyote expired, no air jumps left → cannot jump
  assert.equal(canJump(buf, 1.2, false, 1), false);
});

test('air jump available when off ground and no air jumps used', () => {
  const buf = createJumpBuffer();
  recordJumpPress(buf, 1.0);
  assert.equal(canJump(buf, 1.0, false, 0), true);
});

test('tickBuffer prunes stale entries', () => {
  const buf = createJumpBuffer();
  recordJumpPress(buf, 1.0);
  recordLeftGround(buf, 1.0);
  tickBuffer(buf, 5.0);
  assert.equal(buf.lastJumpPressedAt, null);
  assert.equal(buf.lastLeftGroundAt, null);
});
