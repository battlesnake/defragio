import { createPlayer } from './player/state.js';
import { applyGravity, integrate, applyHorizontalIntent } from './player/physics.js';
import { startJump, releaseJump } from './player/jump.js';
import { resolveCollisions } from './world/collision.js';
import { createDefrag, advanceDefrag, scheduleScriptedOp } from './world/defrag.js';
import {
  startDeathAnimation,
  startFlushAnimation, tickFlush, isFlushDone,
  startDefragInAnimation,
} from './world/animations/index.js';
import { createJumpBuffer, recordJumpPress, recordLeftGround, tickBuffer, canJump, clearJump } from './input/buffer.js';
import { consumeEdges } from './input/keystate.js';
import { isLethal, isCheckpoint, isGoal } from './world/tile.js';
import { createCheckpointTracker, recordCheckpoint, lastCheckpoint } from './world/checkpoint.js';
import { spawnEnemies, tickEnemies } from './enemies/registry.js';
import { play } from './audio/sounds.js';
import { CONFIG } from './config.js';
import { loadLevel } from './world/level-loader.js';
import { levels } from '../levels/index.js';

const EVENT_TELL_DUR = 1.0;

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

function pendingEvents(level) {
  return (level.events || []).map(e => ({ ...e, triggered: false }));
}

// Builds fresh per-level state. `level` is a loaded (mutated-on-the-fly) level.
function freshLevelState(level) {
  return {
    level,
    tilesSnapshot: snapshotTiles(level),
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
    pendingEvents: pendingEvents(level),
    t: 0,
  };
}

export function createGameState(initialLevelIdx = 0) {
  const level = loadLevel(levels[initialLevelIdx]);
  const base = freshLevelState(level);
  return {
    ...base,
    levels,
    levelIdx: initialLevelIdx,
    lives: 3,
    state: 'playing',
    deathReason: null,
    animationDoneAt: 0,
    flush: null,
  };
}

function transitionToLevel(game, idx) {
  const wrappedIdx = idx % game.levels.length;
  const level = loadLevel(game.levels[wrappedIdx]);
  const fresh = freshLevelState(level);
  game.level         = fresh.level;
  game.tilesSnapshot = fresh.tilesSnapshot;
  game.player        = fresh.player;
  game.defrag        = fresh.defrag;
  game.jumpBuffer    = fresh.jumpBuffer;
  game.checkpoints   = fresh.checkpoints;
  game.enemies       = fresh.enemies;
  game.pendingEvents = fresh.pendingEvents;
  game.t             = fresh.t;
  game.levelIdx      = wrappedIdx;
  game.flush         = null;
}

function processEvents(game) {
  for (const e of game.pendingEvents) {
    if (e.triggered) continue;
    if (game.t >= e.time) {
      scheduleScriptedOp(game.defrag, e.type, e.cells, 0, EVENT_TELL_DUR);
      e.triggered = true;
    }
  }
}

export function tick(game, dt, keystate, camera) {
  // Mario-style enemy-hit bounce: player flies up, then falls off the map.
  // No collision, no enemies, no defrag during the bounce.
  if (game.state === 'death-bounce') {
    game.t += dt;
    applyGravity(game.player, dt);
    integrate(game.player, dt);
    if (game.player.y > game.level.height + 5) {
      game.state = 'dying';
      startDeathAnimation(game, game.deathCamera);
    }
    return;
  }

  // Death-text morph phase
  if (game.state === 'dying') {
    game.t += dt;
    advanceDefrag(game.defrag, dt);
    if (game.t >= game.animationDoneAt) respawnOrGameOver(game);
    return;
  }

  // Flush vortex phase
  if (game.state === 'flushing') {
    game.t += dt;
    tickFlush(game.flush, dt);
    if (isFlushDone(game)) {
      // Empty the level entirely (any solid cells the flush did not consume
      // should be wiped before defrag-in writes the next level back in).
      const lvl = game.level;
      for (let r = 0; r < lvl.height; r++) {
        for (let c = 0; c < lvl.width; c++) lvl.tiles[r][c] = 0;
      }
      // Advance to the next level. tilesSnapshot for defrag-in must be the
      // NEW level's data, but the level grid itself stays empty for now.
      const nextIdx = (game.levelIdx + 1) % game.levels.length;
      const nextRaw = game.levels[nextIdx];
      const nextLoaded = loadLevel(nextRaw);
      game.tilesSnapshot = snapshotTiles(nextLoaded);
      // Stash the next-level metadata (we'll switch to it after defrag-in)
      game._pendingNextIdx = nextIdx;
      game.state = 'defragging-in';
      startDefragInAnimation(game);
    }
    return;
  }

  // Defrag-in phase: writes paint the new level back in
  if (game.state === 'defragging-in') {
    game.t += dt;
    advanceDefrag(game.defrag, dt);
    if (game.t >= game.animationDoneAt) {
      // Now actually transition to the next level (player, defrag, enemies, events)
      transitionToLevel(game, game._pendingNextIdx ?? game.levelIdx);
      game._pendingNextIdx = null;
      game.player.invulnTime = 1.0;
      game.state = 'playing';
    }
    return;
  }

  if (game.state !== 'playing') return;

  const { player, defrag, jumpBuffer, level } = game;
  game.t += dt;
  tickBuffer(jumpBuffer, game.t);

  // Pre-scheduled level events (vanishing platforms, appearing bridges)
  processEvents(game);

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
  if (player.invulnTime > 0) player.invulnTime -= dt;
  if (player.invulnTime <= 0) {
    for (const e of game.enemies) {
      if (!e.alive) continue;
      if (Math.abs(e.x - player.x) < 0.6 && Math.abs(e.y - player.y) < 0.6) {
        if (player.vy > 0 && (player.y < e.y - 0.1)) {
          e.alive = false;
          player.vy = -10;
        } else {
          die(game, 'enemy', camera);
          return;
        }
      }
    }
  }

  const cellRow = Math.floor(player.y);
  const cellCol = Math.floor(player.x);
  if (cellRow >= 0 && cellRow < level.height && cellCol >= 0 && cellCol < level.width) {
    const here = level.tiles[cellRow][cellCol];
    if (isLethal(here)) {
      die(game, 'bad_sector', camera);
      return;
    }
    if (isCheckpoint(here)) {
      recordCheckpoint(game.checkpoints, { row: cellRow, col: cellCol });
    }
    if (isGoal(here)) {
      win(game, camera);
      return;
    }
  }

  if (player.y > level.height + 2) {
    die(game, 'fell', camera);
    return;
  }

  if (defrag.front >= player.x) {
    die(game, 'defrag', camera);
    return;
  }
}

function die(game, reason, camera) {
  if (game.state !== 'playing') return;
  game.lives -= 1;
  play('death');
  game.deathReason = reason;
  game.deathCamera = camera;

  if (reason === 'enemy') {
    // Mario-style: bounce up, fall through the level, then morph to YOU LOSE.
    game.state = 'death-bounce';
    game.player.vx = 0;
    game.player.vy = -28;
    game.player.onGround = false;
    game.player.jumping = false;
    game.player.invulnTime = 1e9;
    return;
  }
  game.state = 'dying';
  startDeathAnimation(game, camera);
}

function win(game, camera) {
  if (game.state !== 'playing') return;
  play('levelComplete');
  game.state = 'flushing';
  // Center the vortex at the viewport center, not the player position.
  const center = {
    x: (camera ? camera.x : 0) + (camera ? camera.viewportCols : game.level.width) / 2,
    y: game.level.height / 2,
  };
  startFlushAnimation(game, center);
}

function respawnOrGameOver(game) {
  if (game.lives <= 0) {
    game.state = 'gameover';
    return;
  }
  restoreTiles(game.level, game.tilesSnapshot);
  const cp = lastCheckpoint(game.checkpoints);
  game.player = createPlayer(cp);
  game.player.invulnTime = 1.5;
  game.defrag = createDefrag({
    levelId: game.level.id,
    level: game.level,
    speed: game.level.cursorSpeed,
    initialOffset: CONFIG.CURSOR_INITIAL_OFFSET,
  });
  game.jumpBuffer = createJumpBuffer();
  game.enemies = spawnEnemies(game.level);
  game.pendingEvents = pendingEvents(game.level);
  game.t = 0;
  game.state = 'playing';
}
