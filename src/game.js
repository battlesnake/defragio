import { createPlayer } from './player/state.js';
import { applyGravity, integrate, applyHorizontalIntent } from './player/physics.js';
import { startJump, releaseJump } from './player/jump.js';
import { resolveCollisions } from './world/collision.js';
import { createDefrag, advanceDefrag } from './world/defrag.js';
import { startDeathAnimation, startWinAnimation } from './world/animations.js';
import { createJumpBuffer, recordJumpPress, recordLeftGround, tickBuffer, canJump, clearJump } from './input/buffer.js';
import { consumeEdges } from './input/keystate.js';
import { isLethal, isCheckpoint, isGoal } from './world/tile.js';
import { createCheckpointTracker, recordCheckpoint, lastCheckpoint } from './world/checkpoint.js';
import { spawnEnemies, tickEnemies } from './enemies/registry.js';
import { play } from './audio/sounds.js';
import { CONFIG } from './config.js';

function snapshotTiles(level) {
  return level.tiles.map(row => row.slice());
}
function restoreTiles(level, snapshot) {
  for (let r = 0; r < snapshot.length; r++) {
    for (let c = 0; c < snapshot[r].length; c++) {
      level.tiles[r][c] = snapshot[r][c];
    }
  }
}

export function createGameState(level) {
  const tilesSnapshot = snapshotTiles(level);
  return {
    level,
    tilesSnapshot,
    player: createPlayer(level.playerStart),
    defrag: createDefrag({
      levelId: level.id,
      level,
      speed: level.cursorSpeed,
      initialOffset: CONFIG.CURSOR_INITIAL_OFFSET,
    }),
    jumpBuffer: createJumpBuffer(),
    checkpoints: createCheckpointTracker(level.playerStart),
    enemies: spawnEnemies(level),
    lives: 3,
    t: 0,
    state: 'playing',
    deathReason: null,
    animationDoneAt: 0,
  };
}

export function tick(game, dt, keystate) {
  // While dying / won, run the animation but skip player + input + enemy ticks.
  if (game.state === 'dying' || game.state === 'won') {
    game.t += dt;
    advanceDefrag(game.defrag, dt);
    if (game.t >= game.animationDoneAt) {
      if (game.state === 'dying') respawnOrGameOver(game);
      else game.state = 'won-final';
    }
    return;
  }

  if (game.state !== 'playing') return;

  const { player, defrag, jumpBuffer, level } = game;
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

  if (game.t > CONFIG.CURSOR_START_DELAY_SEC) {
    advanceDefrag(defrag, dt);
  }

  tickEnemies(game.enemies, dt);
  for (const e of game.enemies) {
    if (!e.alive) continue;
    if (Math.abs(e.x - player.x) < 0.6 && Math.abs(e.y - player.y) < 0.6) {
      if (player.vy > 0 && (player.y < e.y - 0.1)) {
        e.alive = false;
        player.vy = -10;
      } else {
        die(game, 'enemy');
        return;
      }
    }
  }

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
      win(game);
      return;
    }
  }

  if (player.y > level.height + 2) {
    die(game, 'fell');
    return;
  }

  if (defrag.front >= player.x) {
    die(game, 'defrag');
    return;
  }
}

function die(game, reason) {
  if (game.state !== 'playing') return;
  game.lives -= 1;
  play('death');
  game.deathReason = reason;
  game.state = 'dying';
  startDeathAnimation(game);
}

function win(game) {
  if (game.state !== 'playing') return;
  play('levelComplete');
  game.state = 'won';
  startWinAnimation(game);
}

function respawnOrGameOver(game) {
  if (game.lives <= 0) {
    game.state = 'gameover';
    return;
  }
  restoreTiles(game.level, game.tilesSnapshot);
  const cp = lastCheckpoint(game.checkpoints);
  game.player = createPlayer(cp);
  game.defrag = createDefrag({
    levelId: game.level.id,
    level: game.level,
    speed: game.level.cursorSpeed,
    initialOffset: CONFIG.CURSOR_INITIAL_OFFSET,
  });
  game.jumpBuffer = createJumpBuffer();
  game.enemies = spawnEnemies(game.level);
  game.t = 0;
  game.state = 'playing';
}
