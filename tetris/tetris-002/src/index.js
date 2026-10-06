#!/usr/bin/env node

const {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  boardHeight,
  boardWidth,
  createInitialState,
  occupiedCells,
  stepGame,
} = require('./game');

const CLEAR_SCREEN = '\x1b[2J\x1b[H';
const MAX_DISPLAY_ROWS = 24;
const DISPLAY_BORDER_ROWS = 2;
const INPUT_ACTIONS = Object.freeze({
  '\u001b[D': 'left',
  a: 'left',
  A: 'left',
  h: 'left',
  H: 'left',
  '\u001b[C': 'right',
  d: 'right',
  D: 'right',
  l: 'right',
  L: 'right',
  '\u001b[A': 'rotate',
  w: 'rotate',
  W: 'rotate',
  k: 'rotate',
  K: 'rotate',
  '\u001b[B': 'down',
  s: 'down',
  S: 'down',
  j: 'down',
  J: 'down',
  ' ': 'drop',
});
const QUIT_KEYS = Object.freeze(['q', 'Q', '\u0003']);

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

function actionForInput(input) {
  const key = String(input);

  if (QUIT_KEYS.includes(key)) {
    return 'quit';
  }

  return INPUT_ACTIONS[key] || null;
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

function countDisplayRows(display) {
  return display.replace(/\n$/, '').split('\n').length;
}

function assertDisplayFitsTerminal(display, maxRows = MAX_DISPLAY_ROWS) {
  const rows = countDisplayRows(display);

  if (rows > maxRows) {
    throw new Error(`Tetris display is ${rows} rows tall; it must fit within ${maxRows} terminal rows.`);
  }
}

function buildDisplay(state = createInitialState()) {
  const board = boardWithActivePiece(state);
  const boardRowsAllowed = MAX_DISPLAY_ROWS - DISPLAY_BORDER_ROWS;

  if (boardHeight(board) > boardRowsAllowed) {
    throw new Error(
      `Tetris board is ${boardHeight(board)} rows tall; it must be ${boardRowsAllowed} rows or fewer to fit within ${MAX_DISPLAY_ROWS} terminal rows.`
    );
  }

  const horizontalBorder = '+' + '-'.repeat(boardWidth(board) * 2) + '+';
  const panel = [
    'Tetris',
    `Score: ${state.score}`,
    `Lines: ${state.linesCleared}`,
    '',
    'Controls:',
    '←/a/h: left',
    '→/d/l: right',
    '↑/w/k: rotate',
    '↓/s/j: drop',
    'space: hard',
    'q: quit',
    '',
    state.gameOver ? 'GAME OVER' : '',
    state.gameOver ? 'Press q to quit' : '',
  ];
  const boardRows = board.map((row, index) => {
    const cells = row.map((cell) => ` ${cell || '.'}`).join('');
    const sideText = panel[index] ? `  ${panel[index]}` : '';
    return `|${cells}|${sideText}`;
  });

  const display = [horizontalBorder, ...boardRows, horizontalBorder].join('\n') + '\n';
  assertDisplayFitsTerminal(display);
  return display;
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
        const action = actionForInput(key);

        if (action === 'quit') {
          app.exit();
          return;
        }

        if (!action) {
          return;
        }

        app.render(stepGame(currentState, action));
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
  MAX_DISPLAY_ROWS,
  actionForInput,
  assertDisplayFitsTerminal,
  boardWithActivePiece,
  buildDisplay,
  clearScreen,
  countDisplayRows,
  createTerminalIO,
  createTetrisApp,
  exit,
  render,
  resolveInitialState,
  start,
};
