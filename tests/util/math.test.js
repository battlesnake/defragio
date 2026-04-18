import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, lerp, sign } from '../../src/util/math.js';

test('clamp clips below min', () => {
  assert.equal(clamp(-1, 0, 10), 0);
});

test('clamp clips above max', () => {
  assert.equal(clamp(11, 0, 10), 10);
});

test('clamp passes through in-range', () => {
  assert.equal(clamp(5, 0, 10), 5);
});

test('lerp interpolates', () => {
  assert.equal(lerp(0, 10, 0.25), 2.5);
});

test('sign returns -1, 0, or 1', () => {
  assert.equal(sign(-3), -1);
  assert.equal(sign(0),  0);
  assert.equal(sign(7),  1);
});
