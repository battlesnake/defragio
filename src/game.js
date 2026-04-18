import { createPlayer } from './player/state.js';
import { applyGravity, integrate, applyHorizontalIntent } from './player/physics.js';
import { startJump, releaseJump } from './player/jump.js';
import { resolveCollisions } from './world/collision.js';
import { createDefrag, advanceDefrag, scheduleScriptedOp } from './world/defrag.js';
import {
  startGameOverAnimation, startQuickDeathAnimation,
  startFlushAnimation, tickFlush, isFlushDone,
  startDefragInAnimation,
  startFinalWinAnimation,
} from './world/animations/index.js';
import { createJumpBuffer, recordJumpPress, recordLeftGround, tickBuffer, canJump, clearJump, inCoyote } from './input/buffer.js';
import { consumeEdges } from './input/keystate.js';
import { isLethal, isCheckpoint, isGoal, isCoin, isFragile, isSolid, TILE } from './world/tile.js';
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
    fragileTimers: new Map(),
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
    score: 0,
    state: 'waiting',
    deathReason: null,
    animationDoneAt: 0,
    flush: null,
  };
}

// Cheat: skip directly to another level. delta = +1 / -1.
// If we go past the last level, trigger the YOU WIN finale.
export function cheatJumpLevel(game, delta, camera) {
  let newIdx = game.levelIdx + delta;
  if (newIdx >= game.levels.length) {
    const lvl = game.level;
    for (let r = 0; r < lvl.height; r++) {
      for (let c = 0; c < lvl.width; c++) lvl.tiles[r][c] = 0;
    }
    game.state = 'final-winning';
    startFinalWinAnimation(game, camera);
    return;
  }
  if (newIdx < 0) newIdx = 0;
  transitionToLevel(game, newIdx);
  game.state = 'waiting';
}

export function togglePause(game) {
  if (game.state === 'paused') {
    game.state = game.pausedFrom || 'playing';
    game.pausedFrom = null;
  } else if (game.state === 'playing' || game.state === 'waiting') {
    game.pausedFrom = game.state;
    game.state = 'paused';
  }
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
  // Frozen — Pause button or Legend modal pressed.
  if (game.state === 'paused') return;

  // Waiting for the player to press a key before any timers run.
  if (game.state === 'waiting') {
    const k = keystate.pressed;
    if (k.has('left') || k.has('right') || k.has('jump') || k.has('drop')) {
      game.state = 'playing';
    }
    return;
  }

  // Mario-style enemy-hit bounce: player flies up, then falls off the map.
  // No collision, no enemies, no defrag during the bounce.
  if (game.state === 'death-bounce') {
    game.t += dt;
    applyGravity(game.player, dt);
    integrate(game.player, dt);
    if (game.player.y > game.level.height + 5) {
      game.state = 'dying';
      startDeathTextAnimation(game, game.deathCamera);
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
      const lvl = game.level;
      for (let r = 0; r < lvl.height; r++) {
        for (let c = 0; c < lvl.width; c++) lvl.tiles[r][c] = 0;
      }
      // If the player just beat the final level, show the YOU WIN finale
      // instead of looping back to level 1.
      if (game.levelIdx === game.levels.length - 1) {
        game.state = 'final-winning';
        startFinalWinAnimation(game, camera);
        return;
      }
      const nextIdx = (game.levelIdx + 1) % game.levels.length;
      const nextRaw = game.levels[nextIdx];
      const nextLoaded = loadLevel(nextRaw);
      game.tilesSnapshot = snapshotTiles(nextLoaded);
      game._pendingNextIdx = nextIdx;
      game.state = 'defragging-in';
      startDefragInAnimation(game);
    }
    return;
  }

  // Finale: disk fully defrags to blue, then carves YOU WIN
  if (game.state === 'final-winning') {
    game.t += dt;
    advanceDefrag(game.defrag, dt);
    if (game.t >= game.animationDoneAt) {
      game.state = 'won-game';
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
      game.state = 'waiting';
    }
    return;
  }

  // Game over — wait briefly so the YOU LOSE text can be read, then any
  // keypress starts a brand-new game.
  if (game.state === 'gameover') {
    game.gameoverElapsed = (game.gameoverElapsed || 0) + dt;
    if (game.gameoverElapsed >= 1.5 && keystate.pressed.size > 0) {
      const fresh = createGameState();
      Object.assign(game, fresh);
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
  if (canJump(jumpBuffer, game.t, player.onGround, player.airJumpsUsed)) {
    if (!player.onGround && !inCoyote(jumpBuffer, game.t)) {
      player.airJumpsUsed += 1;
    }
    startJump(player);
    clearJump(jumpBuffer);
  }

  applyGravity(player, dt);
  integrate(player, dt);
  resolveCollisions(player, level);

  if (wasOnGround && !player.onGround) recordLeftGround(jumpBuffer, game.t);
  if (!wasOnGround && player.onGround) player.airJumpsUsed = 0;

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

  // Touch detection — checks every cell the player's AABB overlaps,
  // PLUS the cell directly under their feet (so standing on a B sector kills).
  const yT = Math.floor(player.y - 0.5 + 0.01);
  const yB = Math.floor(player.y + 0.5 - 0.01);
  const xL = Math.floor(player.x - 0.5 + 0.01);
  const xR = Math.floor(player.x + 0.5 - 0.01);
  const feetRow = Math.floor(player.y + 0.5 + 0.01);
  const cellRow = Math.floor(player.y);
  const cellCol = Math.floor(player.x);

  // Lethality check: any AABB cell or feet cell that's lethal kills.
  const lethalChecks = [
    [yT, xL], [yT, xR], [yB, xL], [yB, xR],
    [feetRow, xL], [feetRow, xR],
  ];
  for (const [r, c] of lethalChecks) {
    if (r < 0 || r >= level.height || c < 0 || c >= level.width) continue;
    if (isLethal(level.tiles[r][c])) {
      die(game, 'bad_sector', camera);
      return;
    }
  }

  if (cellRow >= 0 && cellRow < level.height && cellCol >= 0 && cellCol < level.width) {
    const here = level.tiles[cellRow][cellCol];
    if (isCheckpoint(here)) {
      recordCheckpoint(game.checkpoints, { row: cellRow, col: cellCol });
    }
    if (isCoin(here)) {
      game.score += 10;
      level.tiles[cellRow][cellCol] = TILE.FREE;
    }
    if (isGoal(here)) {
      win(game, camera);
      return;
    }
    // Death-by-write: a non-lethal solid tile materialised on top of us.
    if (isSolid(here)) {
      die(game, 'crushed', camera);
      return;
    }
  }

  // Fragile cracking: cells under the player's feet that are FRAGILE start
  // a 0.5s timer; when it expires the cell becomes free (player falls
  // through). The timer is per-cell and only set on first touch.
  if (feetRow >= 0 && feetRow < level.height) {
    for (let c = xL; c <= xR; c++) {
      if (c < 0 || c >= level.width) continue;
      if (isFragile(level.tiles[feetRow][c])) {
        const key = feetRow * 10000 + c;
        if (!game.fragileTimers.has(key)) {
          game.fragileTimers.set(key, game.t + 0.5);
        }
      }
    }
  }
  // Process expiring fragile cells.
  for (const [key, expiresAt] of game.fragileTimers) {
    if (game.t >= expiresAt) {
      const r = Math.floor(key / 10000);
      const c = key - r * 10000;
      if (level.tiles[r][c] === TILE.FRAGILE) level.tiles[r][c] = TILE.FREE;
      game.fragileTimers.delete(key);
    }
  }

  if (player.y > level.height + 2) {
    die(game, 'fell', camera);
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
  startDeathTextAnimation(game, camera);
}

function startDeathTextAnimation(game, camera) {
  if (game.lives <= 0) startGameOverAnimation(game, camera);
  else startQuickDeathAnimation(game, camera);
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
    game.gameoverElapsed = 0;
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
