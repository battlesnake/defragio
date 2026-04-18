export function createCheckpointTracker(start) {
  return { last: { row: start.row, col: start.col } };
}

export function recordCheckpoint(tracker, cell) {
  tracker.last = { row: cell.row, col: cell.col };
}

export function lastCheckpoint(tracker) {
  return { row: tracker.last.row, col: tracker.last.col };
}
