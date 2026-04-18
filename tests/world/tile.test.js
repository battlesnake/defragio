import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TILE, isSolid, isLethal, fromChar, cellClassFor } from '../../src/world/tile.js';

test('TILE constants are defined', () => {
  assert.ok(TILE.FREE !== undefined);
  assert.ok(TILE.CYAN_SOLID !== undefined);
  assert.ok(TILE.SYS !== undefined);
  assert.ok(TILE.BAD !== undefined);
  assert.ok(TILE.GOAL !== undefined);
});

test('isSolid: solid blocks return true', () => {
  for (const t of [TILE.CYAN_SOLID, TILE.CYAN_DIAG, TILE.CYAN_DOTS, TILE.OPT, TILE.SYS, TILE.FRAGILE]) {
    assert.ok(isSolid(t), `expected solid: ${t}`);
  }
});

test('isSolid: free / goal / checkpoint return non-solid; bad is solid', () => {
  assert.equal(isSolid(TILE.FREE), false);
  assert.equal(isSolid(TILE.BAD), true);
  assert.equal(isSolid(TILE.GOAL), false);
  assert.equal(isSolid(TILE.CHECKPOINT), false);
});

test('isLethal: bad sector', () => {
  assert.equal(isLethal(TILE.BAD), true);
  assert.equal(isLethal(TILE.CYAN_SOLID), false);
});

test('fromChar parses ASCII chars', () => {
  assert.equal(fromChar('.'), TILE.FREE);
  assert.equal(fromChar('~'), TILE.CYAN_SOLID);
  assert.equal(fromChar(':'), TILE.CYAN_DIAG);
  assert.equal(fromChar("'"), TILE.CYAN_DOTS);
  assert.equal(fromChar('Y'), TILE.SYS);
  assert.equal(fromChar('B'), TILE.BAD);
  assert.equal(fromChar('G'), TILE.GOAL);
  assert.equal(fromChar('C'), TILE.CHECKPOINT);
  assert.equal(fromChar('F'), TILE.FRAGILE);
  assert.equal(fromChar('O'), TILE.OPT);
});

test('cellClassFor returns the CSS class', () => {
  assert.equal(cellClassFor(TILE.FREE), 'cell--free');
  assert.equal(cellClassFor(TILE.CYAN_SOLID), 'cell--cyan-solid');
  assert.equal(cellClassFor(TILE.BAD), 'cell--bad');
  assert.equal(cellClassFor(TILE.GOAL), 'cell--goal');
});
