import { ACTIVE_CELL, EMPTY_CELL, LOCKED_CELL } from './cells.js';

const CELL_GLYPHS = {
  [ACTIVE_CELL]: '#',
  [LOCKED_CELL]: '#',
};
const CONTROLS_TEXT = 'Controls: ←/→ move  ↓ drop  ↑ rotate  q quit';
const GAME_OVER_TEXT = 'GAME OVER';

export function renderGameDisplay({
  board,
  score = 0,
  lines = 0,
  gameOver = false,
  status = '',
}) {
  const width = board[0]?.length ?? 0;
  const border = `+${'-'.repeat(width)}+`;
  const boardRows = board.map((row) => `|${row.map(renderCell).join('')}|`);
  const message = gameOver ? GAME_OVER_TEXT : status;
  const messageText = message ? `  ${message}` : '';

  return [
    border,
    ...boardRows,
    border,
    `Score: ${score}  Lines: ${lines}${messageText}`,
    CONTROLS_TEXT,
  ].join('\n');
}

function renderCell(cell) {
  if (cell === EMPTY_CELL) {
    return ' ';
  }

  return CELL_GLYPHS[cell] ?? String(cell);
}
