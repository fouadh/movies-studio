import { TetrisGame } from './game.js';
import { render } from './render.js';

const TICK_INTERVAL_MS = 700;

const game = new TetrisGame();
let timer = null;
let running = true;

function draw() {
  process.stdout.write('\x1b[?25l');
  process.stdout.write('\x1b[H\x1b[2J');
  process.stdout.write(`${render(game)}\n`);
}

function stop(message = '') {
  if (!running) return;
  running = false;

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }

  process.stdin.pause();
  process.stdout.write('\x1b[?25h');
  if (message) {
    process.stdout.write(`${message}\n`);
  }
}

function tick() {
  game.tick();
  draw();

  if (game.gameOver) {
    stop('Game over. Press npm start to play again.');
  }
}

function handleKey(data) {
  const key = data.toString('utf8');

  if (key === '\u0003' || key === 'q' || key === 'Q') {
    stop('Quit.');
    return;
  }

  if (game.gameOver) return;

  if (key === '\x1b[D' || key === 'a' || key === 'A') {
    game.moveLeft();
  } else if (key === '\x1b[C' || key === 'd' || key === 'D') {
    game.moveRight();
  } else if (key === '\x1b[A' || key === 'x' || key === 'X' || key === 'w' || key === 'W') {
    game.rotate(1);
  } else if (key === '\x1b[B' || key === 's' || key === 'S') {
    game.softDrop();
  } else if (key === ' ') {
    game.hardDrop();
  } else {
    return;
  }

  draw();

  if (game.gameOver) {
    stop('Game over. Press npm start to play again.');
  }
}

process.on('SIGINT', () => stop('Quit.'));
process.on('exit', () => {
  if (process.stdout.isTTY) {
    process.stdout.write('\x1b[?25h');
  }
});

if (!process.stdin.isTTY) {
  console.log(render(game, { useColor: false }));
} else {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', handleKey);

  draw();
  timer = setInterval(tick, TICK_INTERVAL_MS);
}
