import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCheckpointTracker, recordCheckpoint, lastCheckpoint } from '../../src/world/checkpoint.js';

test('lastCheckpoint returns level start when no checkpoint touched', () => {
  const tracker = createCheckpointTracker({ row: 12, col: 2 });
  assert.deepEqual(lastCheckpoint(tracker), { row: 12, col: 2 });
});

test('recordCheckpoint updates the last position', () => {
  const tracker = createCheckpointTracker({ row: 12, col: 2 });
  recordCheckpoint(tracker, { row: 12, col: 22 });
  assert.deepEqual(lastCheckpoint(tracker), { row: 12, col: 22 });
});

test('recordCheckpoint of same position is idempotent', () => {
  const tracker = createCheckpointTracker({ row: 12, col: 2 });
  recordCheckpoint(tracker, { row: 12, col: 22 });
  recordCheckpoint(tracker, { row: 12, col: 22 });
  assert.deepEqual(lastCheckpoint(tracker), { row: 12, col: 22 });
});
