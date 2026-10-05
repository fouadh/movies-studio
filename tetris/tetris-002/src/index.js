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

function createTerminalIO({ input = process.stdin, output = process.stdout } = {}) {
  return {
    input,
    output,
    get isInteractive() {
      return Boolean(input.isTTY);
    },
    clearScreen() {
      output.write(CLEAR_SCREEN);
    },
    write(text) {
      output.write(text);
    },
    enableRawMode() {
      if (input.isTTY && typeof input.setRawMode === 'function') {
        input.setRawMode(true);
      }
    },
    disableRawMode() {
      if (input.isTTY && typeof input.setRawMode === 'function') {
        input.setRawMode(false);
      }
    },
    setEncoding(encoding) {
      if (typeof input.setEncoding === 'function') {
        input.setEncoding(encoding);
      }
    },
    resume() {
      if (typeof input.resume === 'function') {
        input.resume();
      }
    },
    pause() {
      if (typeof input.pause === 'function') {
        input.pause();
      }
    },
    onData(handler) {
      input.on('data', handler);
    },
    offData(handler) {
      if (typeof input.off === 'function') {
        input.off('data', handler);
      } else if (typeof input.removeListener === 'function') {
        input.removeListener('data', handler);
      }
    },
  };
}

function terminalFromOptions({ terminal, input, output } = {}) {
  return terminal || createTerminalIO({ input, output });
}

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

function render({ output, terminal, state = createInitialState() } = {}) {
  const terminalIO = terminalFromOptions({ terminal, output });
  terminalIO.clearScreen();
  terminalIO.write(buildDisplay(state));
}

function exit({ input, output, terminal } = {}) {
  const terminalIO = terminalFromOptions({ terminal, input, output });
  terminalIO.clearScreen();
  terminalIO.write('Thanks for playing Tetris.\n');
  terminalIO.disableRawMode();
  terminalIO.pause();
}

function start({
  input,
  output,
  terminal,
  state = createInitialState(),
} = {}) {
  const terminalIO = terminalFromOptions({ terminal, input, output });
  render({ terminal: terminalIO, state });

  if (!terminalIO.isInteractive) {
    return () => {};
  }

  terminalIO.setEncoding('utf8');
  terminalIO.enableRawMode();
  terminalIO.resume();

  const onData = (key) => {
    if (key === 'q' || key === '\u0003') {
      exit({ terminal: terminalIO });
    }
  };

  terminalIO.onData(onData);

  return () => {
    terminalIO.offData(onData);
    terminalIO.disableRawMode();
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
  createTerminalIO,
  exit,
  render,
  start,
};
