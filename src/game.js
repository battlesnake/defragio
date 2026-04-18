import { createPlayer } from './player/state.js';
import { applyGravity, integrate, applyHorizontalIntent } from './player/physics.js';
import { startJump, releaseJump } from './player/jump.js';
import { resolveCollisions } from './world/collision.js';
import { createCursor, advanceCursor } from './world/cursor.js';
import { createJumpBuffer, recordJumpPress, recordLeftGround, tickBuffer, canJump, clearJump } from './input/buffer.js';
import { consumeEdges } from './input/keystate.js';

export function createGameState(level) {
  return {
    level,
    player: createPlayer(level.playerStart),
    cursor: createCursor({ levelId: level.id, height: level.height, speed: level.cursorSpeed }),
    jumpBuffer: createJumpBuffer(),
    t: 0,
    state: 'playing',
  };
}

export function tick(game, dt, keystate) {
  if (game.state !== 'playing') return;

  const { player, cursor, jumpBuffer, level } = game;
  game.t += dt;
  tickBuffer(jumpBuffer, game.t);

  const edges = consumeEdges(keystate);
  if (edges.has('jump')) recordJumpPress(jumpBuffer, game.t);
  if (player.jumping && !keystate.pressed.has('jump')) {
    releaseJump(player);
  }
  let intent = 0;
  if (keystate.pressed.has('left'))  intent -= 1;
  if (keystate.pressed.has('right')) intent += 1;
  applyHorizontalIntent(player, intent, dt);

  const wasOnGround = player.onGround;
  if (canJump(jumpBuffer, game.t, player.onGround)) {
    startJump(player);
    clearJump(jumpBuffer);
  }

  applyGravity(player, dt);
  integrate(player, dt);
  resolveCollisions(player, level);

  if (wasOnGround && !player.onGround) recordLeftGround(jumpBuffer, game.t);

  advanceCursor(cursor, dt);
}
