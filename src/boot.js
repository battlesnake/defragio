import { CONFIG } from './config.js';
import { loadLevel } from './world/level-loader.js';
import { createGameState, tick } from './game.js';
import { createCamera, updateCamera } from './render/camera.js';
import { createGridRenderer, paintGrid } from './render/grid.js';
import { createPlayerSprite, positionPlayerSprite } from './render/player-sprite.js';
import { createCursorSprite, positionCursorSprite } from './render/cursor-sprite.js';
import { createKeyState, attachKeyState } from './input/keystate.js';
import level1 from '../levels/level1.js';

const level = loadLevel(level1);
const game  = createGameState(level);

const display = document.getElementById('display');
const renderer = createGridRenderer({
  container: display,
  viewportCols: CONFIG.VIEWPORT_COLS,
  viewportRows: level.height,
  cellWidth: CONFIG.CELL_W,
  cellHeight: CONFIG.CELL_H,
});
const camera = createCamera();

display.style.position = 'relative';
const overlay = document.createElement('div');
overlay.style.position = 'absolute';
overlay.style.top = '4px';
overlay.style.left = '4px';
overlay.style.pointerEvents = 'none';
display.appendChild(overlay);

const playerEl = createPlayerSprite(overlay);
const cursorEls = createCursorSprite(overlay, level.height);

const keystate = createKeyState();
attachKeyState(keystate);

const FIXED_DT = 1 / 60;
let acc = 0;
let last = performance.now() / 1000;

function frame(now) {
  const t = now / 1000;
  const dt = Math.min(0.05, t - last);
  last = t;
  acc += dt;
  while (acc >= FIXED_DT) {
    tick(game, FIXED_DT, keystate);
    acc -= FIXED_DT;
  }
  updateCamera(camera, game.player, game.cursor);
  paintGrid(renderer, level, camera);
  positionPlayerSprite(playerEl, game.player, camera);
  positionCursorSprite(cursorEls, game.cursor, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
