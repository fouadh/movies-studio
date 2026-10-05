#!/usr/bin/env node

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CLEAR_SCREEN = '\x1b[2J\x1b[H';

function clearScreen(output = process.stdout) {
  output.write(CLEAR_SCREEN);
}

function buildDisplay({ score = 0 } = {}) {
  const horizontalBorder = '+' + '-'.repeat(BOARD_WIDTH * 2) + '+';
  const emptyRow = '|' + ' .'.repeat(BOARD_WIDTH) + '|';
  const boardRows = Array.from({ length: BOARD_HEIGHT }, () => emptyRow);

  return [
    `Tetris  Score: ${score}`,
    horizontalBorder,
    ...boardRows,
    horizontalBorder,
    'Controls: ←/→ move, ↑ rotate, ↓ drop, q quit',
  ].join('\n') + '\n';
}

function render({ output = process.stdout, state = {} } = {}) {
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

function start({ input = process.stdin, output = process.stdout } = {}) {
  render({ output });

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
  buildDisplay,
  clearScreen,
  exit,
  render,
  start,
};
