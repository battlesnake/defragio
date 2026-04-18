import { KEY_TO_ACTION, GAME_KEYS } from './keymap.js';

export function createKeyState() {
  return {
    pressed: new Set(),
    pressedEdge: new Set(),
  };
}

export function attachKeyState(keystate, target = window) {
  target.addEventListener('keydown', (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    const action = KEY_TO_ACTION[e.code];
    if (!action) return;
    if (!keystate.pressed.has(action)) keystate.pressedEdge.add(action);
    keystate.pressed.add(action);
  });
  target.addEventListener('keyup', (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    const action = KEY_TO_ACTION[e.code];
    if (!action) return;
    keystate.pressed.delete(action);
  });
}

export function consumeEdges(keystate) {
  const edges = new Set(keystate.pressedEdge);
  keystate.pressedEdge.clear();
  return edges;
}
