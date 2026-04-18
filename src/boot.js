import { CONFIG } from './config.js';
import { loadLevel } from './world/level-loader.js';
import { createGameState, tick } from './game.js';
import { createCamera, updateCamera } from './render/camera.js';
import { createGridRenderer, paintGrid } from './render/grid.js';
import { bindChrome, updateChrome } from './render/chrome.js';
import { loadSounds } from './audio/sounds.js';
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

const keystate = createKeyState();
attachKeyState(keystate);
bindChrome();
loadSounds({
  death:         'assets/audio/death.wav',
  levelComplete: 'assets/audio/level-complete.wav',
});

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
  updateCamera(camera, game.player);
  paintGrid(renderer, level, camera, game.cursor, game.enemies, game.player);
  updateChrome(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
