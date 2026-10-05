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

function resolveInitialState({ state, random, initialStateOptions = {}, createState = createInitialState } = {}) {
  if (state !== undefined) {
    return state;
  }

  return createState({
    ...initialStateOptions,
    random: random || initialStateOptions.random,
  });
}

function createTetrisApp({
  input,
  output,
  terminal,
  state,
  random,
  initialStateOptions,
  createState = createInitialState,
} = {}) {
  const terminalIO = terminalFromOptions({ terminal, input, output });
  let currentState = resolveInitialState({ state, random, initialStateOptions, createState });
  let onData;

  const stop = () => {
    if (onData) {
      terminalIO.offData(onData);
      onData = undefined;
    }
    terminalIO.disableRawMode();
  };

  const app = {
    get state() {
      return currentState;
    },
    render(nextState = currentState) {
      currentState = nextState;
      terminalIO.clearScreen();
      terminalIO.write(buildDisplay(currentState));
    },
    stop,
    exit() {
      stop();
      terminalIO.clearScreen();
      terminalIO.write('Thanks for playing Tetris.\n');
      terminalIO.pause();
    },
    start() {
      app.render();

      if (!terminalIO.isInteractive) {
        return stop;
      }

      terminalIO.setEncoding('utf8');
      terminalIO.enableRawMode();
      terminalIO.resume();

      onData = (key) => {
        if (key === 'q' || key === '\u0003') {
          app.exit();
        }
      };

      terminalIO.onData(onData);

      return stop;
    },
  };

  return app;
}

function render({ output, terminal, state, random, initialStateOptions, createState } = {}) {
  createTetrisApp({ terminal, output, state, random, initialStateOptions, createState }).render();
}

function exit({ input, output, terminal } = {}) {
  createTetrisApp({ terminal, input, output }).exit();
}

function start(options = {}) {
  return createTetrisApp(options).start();
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
  createTetrisApp,
  exit,
  render,
  resolveInitialState,
  start,
};
