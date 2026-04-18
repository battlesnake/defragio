const VIRUS_SPEED = 2.5;

export function createVirus(spec) {
  const { cell, patrol } = spec;
  return {
    type: 'virus',
    x: cell.col + 0.5,
    y: cell.row + 0.5,
    vx: VIRUS_SPEED,
    width: 1, height: 1,
    patrolFrom: patrol.from,
    patrolTo: patrol.to,
    alive: true,
  };
}

export function tickVirus(v, dt) {
  if (!v.alive) return;
  v.x += v.vx * dt;
  if (v.x > v.patrolTo + 0.5) v.vx = -VIRUS_SPEED;
  else if (v.x < v.patrolFrom + 0.5) v.vx = VIRUS_SPEED;
}
