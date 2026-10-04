const FILLED_CELL = '██';
const EMPTY_CELL = '  ';
const PIECE_COLORS = {
  I: '\x1b[36m',
  O: '\x1b[33m',
  T: '\x1b[35m',
  S: '\x1b[32m',
  Z: '\x1b[31m',
  J: '\x1b[34m',
  L: '\x1b[37m',
};
const RESET = '\x1b[0m';

function cellText(cell, useColor) {
  if (cell === null) return EMPTY_CELL;
  const block = FILLED_CELL;
  if (!useColor) return block;
  return `${PIECE_COLORS[cell] ?? ''}${block}${RESET}`;
}

export function render(gameOrSnapshot, { useColor = process.stdout.isTTY } = {}) {
  const snapshot = typeof gameOrSnapshot.snapshot === 'function' ? gameOrSnapshot.snapshot() : gameOrSnapshot;
  const board = snapshot.board;
  const boardWidth = board[0]?.length ?? 0;
  const innerWidth = boardWidth * 2;
  const status = snapshot.gameOver
    ? `GAME OVER  Score:${snapshot.score} Lines:${snapshot.lines}`
    : `Score:${snapshot.score} Lines:${snapshot.lines} Level:${snapshot.level}`;
  const lines = [status, `┌${'─'.repeat(innerWidth)}┐`];

  for (const row of board) {
    lines.push(`│${row.map((cell) => cellText(cell, useColor)).join('')}│`);
  }

  lines.push(`└${'─'.repeat(innerWidth)}┘`);
  lines.push('←/→ move  ↑/x rotate  ↓ drop  space hard  q quit');

  return lines.slice(0, 24).join('\n');
}
