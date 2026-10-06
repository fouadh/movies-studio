import { EMPTY_CELL } from './cells.js';

export { EMPTY_CELL } from './cells.js';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export function createEmptyBoard({
  width = BOARD_WIDTH,
  height = BOARD_HEIGHT,
  emptyCell = EMPTY_CELL,
} = {}) {
  return Array.from({ length: height }, () => Array(width).fill(emptyCell));
}

export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

export function isInsideBoard(board, { x, y }) {
  return y >= 0 && y < board.length && x >= 0 && x < (board[0]?.length ?? 0);
}

export function isCellEmpty(board, { x, y }) {
  return board[y]?.[x] === EMPTY_CELL;
}

export function clearCompletedLines(board) {
  const width = board[0]?.length ?? 0;
  const remainingRows = board.filter((row) => row.some((cell) => cell === EMPTY_CELL));
  const cleared = board.length - remainingRows.length;
  const emptyRows = Array.from({ length: cleared }, () => Array(width).fill(EMPTY_CELL));

  return {
    board: [...emptyRows, ...remainingRows],
    cleared,
  };
}
