import { createVirus, tickVirus } from './virus.js';

const FACTORIES = {
  virus: createVirus,
};
const TICKERS = {
  virus: tickVirus,
};

export function spawnEnemies(level) {
  return level.enemies.map(spec => {
    const f = FACTORIES[spec.type];
    if (!f) throw new Error(`Unknown enemy type: ${spec.type}`);
    return f(spec);
  });
}

export function tickEnemies(enemies, dt) {
  for (const e of enemies) {
    const t = TICKERS[e.type];
    if (t) t(e, dt);
  }
}
