import { createPlayer } from './player/state.js';
import { applyGravity, integrate, applyHorizontalIntent } from './player/physics.js';
import { startJump, releaseJump } from './player/jump.js';
import { resolveCollisions } from './world/collision.js';
import { createCursor, advanceCursor, cursorAtRow } from './world/cursor.js';
import { createJumpBuffer, recordJumpPress, recordLeftGround, tickBuffer, canJump, clearJump } from './input/buffer.js';
import { consumeEdges } from './input/keystate.js';
import { isLethal, isCheckpoint, isGoal } from './world/tile.js';
import { createCheckpointTracker, recordCheckpoint, lastCheckpoint } from './world/checkpoint.js';

export function createGameState(level) {
  return {
    level,
    player: createPlayer(level.playerStart),
    cursor: createCursor({ levelId: level.id, height: level.height, speed: level.cursorSpeed }),
    jumpBuffer: createJumpBuffer(),
    checkpoints: createCheckpointTracker(level.playerStart),
    t: 0,
    state: 'playing',
    deathReason: null,
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

  // --- Touch detection: checkpoint, goal, lethal ---
  const cellRow = Math.floor(player.y);
  const cellCol = Math.floor(player.x);
  if (cellRow >= 0 && cellRow < level.height && cellCol >= 0 && cellCol < level.width) {
    const here = level.tiles[cellRow][cellCol];
    if (isLethal(here)) {
      die(game, 'bad_sector');
      return;
    }
    if (isCheckpoint(here)) {
      recordCheckpoint(game.checkpoints, { row: cellRow, col: cellCol });
    }
    if (isGoal(here)) {
      game.state = 'won';
      return;
    }
  }

  // --- Cursor catch ---
  const cursorX = cursorAtRow(cursor, cellRow);
  if (cursorX >= player.x) {
    die(game, 'cursor');
    return;
  }
}

function die(game, reason) {
  game.state = 'dying';
  game.deathReason = reason;
  const cp = lastCheckpoint(game.checkpoints);
  const newPlayer = createPlayer(cp);
  game.cursor = createCursor({ levelId: game.level.id, height: game.level.height, speed: game.level.cursorSpeed });
  game.player = newPlayer;
  game.jumpBuffer = createJumpBuffer();
  game.t = 0;
  game.state = 'playing';
}
