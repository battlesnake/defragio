export function createPlayer(start) {
  return {
    x: start.col + 0.5,
    y: start.row + 0.5,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    state: 'falling',
    jumping: false,
    width: 1,
    height: 1,
    invulnTime: 0,
  };
}
