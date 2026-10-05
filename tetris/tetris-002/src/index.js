#!/usr/bin/env node

const {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  boardHeight,
  boardWidth,
  createInitialState,
  occupiedCells,
} = require('./game');

const CLEAR_SCREEN = '\x1b[2J\x1b[H';

function clearScreen(output = process.stdout) {
  output.write(CLEAR_SCREEN);
}

function boardWithActivePiece(state) {
  const board = state.board.map((row) => row.slice());
  const width = boardWidth(board);
  const height = boardHeight(board);

  occupiedCells(state.active).forEach(({ x, y, type }) => {
    if (y >= 0 && y < height && x >= 0 && x < width) {
      board[y][x] = type;
    }
  });

  return board;
}

function buildDisplay(state = createInitialState()) {
  const board = boardWithActivePiece(state);
  const horizontalBorder = '+' + '-'.repeat(boardWidth(board) * 2) + '+';
  const boardRows = board.map((row) =>
    '|' + row.map((cell) => ` ${cell || '.'}`).join('') + '|'
  );
  const footer = state.gameOver
    ? 'Game over. Press q to quit.'
    : 'Controls: ←/→ move, ↑ rotate, ↓ drop, q quit';

  return [
    `Tetris  Score: ${state.score}`,
    horizontalBorder,
    ...boardRows,
    horizontalBorder,
    footer,
  ].join('\n') + '\n';
}

function render({ output = process.stdout, state = createInitialState() } = {}) {
  clearScreen(output);
  output.write(buildDisplay(state));
}

function exit({ input = process.stdin, output = process.stdout } = {}) {
  clearScreen(output);
  output.write('Thanks for playing Tetris.\n');

  if (input.isTTY && typeof input.setRawMode === 'function') {
    input.setRawMode(false);
  }

  if (typeof input.pause === 'function') {
    input.pause();
  }
}

function start({
  input = process.stdin,
  output = process.stdout,
  state = createInitialState(),
} = {}) {
  render({ output, state });

  if (!input.isTTY) {
    return () => {};
  }

  if (typeof input.setEncoding === 'function') {
    input.setEncoding('utf8');
  }
  if (typeof input.setRawMode === 'function') {
    input.setRawMode(true);
  }
  if (typeof input.resume === 'function') {
    input.resume();
  }

  const onData = (key) => {
    if (key === 'q' || key === '\u0003') {
      exit({ input, output });
    }
  };

  input.on('data', onData);

  return () => {
    input.off('data', onData);
    if (input.isTTY && typeof input.setRawMode === 'function') {
      input.setRawMode(false);
    }
  };
}

if (require.main === module) {
  start();
}

module.exports = {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  boardWithActivePiece,
  buildDisplay,
  clearScreen,
  exit,
  render,
  start,
};
