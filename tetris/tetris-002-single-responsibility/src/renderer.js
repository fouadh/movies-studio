export function renderGameDisplay({ board, score = 0, lines = 0, status = '' }) {
  const width = board[0]?.length ?? 0;
  const border = `+${'-'.repeat(width)}+`;
  const boardRows = board.map((row) => `|${row.join('')}|`);
  const statusText = status ? ` ${status}` : '';

  return [
    border,
    ...boardRows,
    border,
    `Score: ${score}  Lines: ${lines}${statusText}`,
    'Controls: q quit',
  ].join('\n');
}
