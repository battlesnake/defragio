import { CONFIG } from './config.js';
import { createGameState, tick } from './game.js';
import { createCamera, updateCamera, resetCamera } from './render/camera.js';
import { createGridRenderer, paintGrid } from './render/grid.js';
import { bindChrome, updateChrome } from './render/chrome.js';
import { loadSounds } from './audio/sounds.js';
import { createKeyState, attachKeyState } from './input/keystate.js';
import { attachCheatListener } from './input/cheat.js';

const game = createGameState();

const display = document.getElementById('display');
const renderer = createGridRenderer({
  container: display,
  viewportCols: CONFIG.VIEWPORT_COLS,
  viewportRows: game.level.height,
  cellWidth: CONFIG.CELL_W,
  cellHeight: CONFIG.CELL_H,
});
const camera = createCamera();

const keystate = createKeyState();
attachKeyState(keystate);
attachCheatListener(game);
bindChrome();
loadSounds({
  death:         'assets/audio/death.wav',
  levelComplete: 'assets/audio/level-complete.wav',
});

const FIXED_DT = 1 / 60;
let acc = 0;
let last = performance.now() / 1000;
let prevState = game.state;

function frame(now) {
  const t = now / 1000;
  const dt = Math.min(0.05, t - last);
  last = t;
  acc += dt;
  while (acc >= FIXED_DT) {
    tick(game, FIXED_DT, keystate, camera);
    acc -= FIXED_DT;
  }
  if (prevState !== 'playing' && game.state === 'playing') {
    resetCamera(camera);
  }
  prevState = game.state;
  updateCamera(camera, game.player, game.level.width);
  const showActors = game.state === 'playing' || game.state === 'death-bounce';
  const particles = game.state === 'flushing' && game.flush ? game.flush.particles : null;
  paintGrid(
    renderer,
    game.level,
    camera,
    game.defrag,
    showActors ? game.enemies : [],
    showActors ? game.player  : null,
    particles,
  );
  updateChrome(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
