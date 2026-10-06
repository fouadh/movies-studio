export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const EMPTY_CELL = ' ';

export function createEmptyBoard({
  width = BOARD_WIDTH,
  height = BOARD_HEIGHT,
  emptyCell = EMPTY_CELL,
} = {}) {
  return Array.from({ length: height }, () => Array(width).fill(emptyCell));
}
