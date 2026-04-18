const JUMP_BUFFER_SEC  = 0.08;
const COYOTE_TIME_SEC  = 0.08;

export function createJumpBuffer() {
  return {
    lastJumpPressedAt: null,
    lastLeftGroundAt: null,
  };
}

export function recordJumpPress(buf, t) {
  buf.lastJumpPressedAt = t;
}

export function recordLeftGround(buf, t) {
  buf.lastLeftGroundAt = t;
}

export function tickBuffer(buf, t) {
  if (buf.lastJumpPressedAt !== null && t - buf.lastJumpPressedAt > JUMP_BUFFER_SEC) {
    buf.lastJumpPressedAt = null;
  }
  if (buf.lastLeftGroundAt !== null && t - buf.lastLeftGroundAt > COYOTE_TIME_SEC) {
    buf.lastLeftGroundAt = null;
  }
}

export function canJump(buf, t, onGround) {
  const recentPress = buf.lastJumpPressedAt !== null && (t - buf.lastJumpPressedAt) <= JUMP_BUFFER_SEC;
  if (!recentPress) return false;
  if (onGround) return true;
  const inCoyote = buf.lastLeftGroundAt !== null && (t - buf.lastLeftGroundAt) <= COYOTE_TIME_SEC;
  return inCoyote;
}

export function clearJump(buf) {
  buf.lastJumpPressedAt = null;
  buf.lastLeftGroundAt = null;
}
