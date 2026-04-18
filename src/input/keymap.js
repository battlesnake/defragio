// Map browser KeyboardEvent.code → game action.
export const KEY_TO_ACTION = {
  ArrowLeft: 'left',  KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump',    KeyW: 'jump',  Space: 'jump',
  ArrowDown: 'drop',  KeyS: 'drop',
};

export const GAME_KEYS = new Set(Object.keys(KEY_TO_ACTION));
