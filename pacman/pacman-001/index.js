#!/usr/bin/env node

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const MAZE_TEMPLATE = [
  '###################',
  '#........#........#',
  '#.###.##.#.##.###.#',
  '#o#.............#o#',
  '#.###.#.###.#.###.#',
  '#.....#..G..#.....#',
  '#####.### ###.#####',
  '    #.#  G  #.#    ',
  '#####.# ### #.#####',
  '#.........P.......#',
  '#.###.#######.###.#',
  '#o..#....#....#..o#',
  '###.#.##.#.##.#.###',
  '#.................#',
  '###################',
];

const TILE = {
  wall: '#',
  empty: ' ',
  pellet: '.',
  powerPellet: 'o',
};

const DISPLAY = {
  player: 'C',
  ghost: 'M',
  wall: '█',
  pellet: '·',
  powerPellet: '●',
  empty: ' ',
};

function clonePosition(position) {
  return { x: position.x, y: position.y };
}

function createGame() {
  const grid = MAZE_TEMPLATE.map((row) => row.split(''));
  const ghosts = [];
  let player = null;
  let pelletsRemaining = 0;

  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      const cell = grid[y][x];
      if (cell === 'P') {
        player = { x, y };
        grid[y][x] = TILE.empty;
      } else if (cell === 'G') {
        ghosts.push({ start: { x, y }, position: { x, y }, direction: 'left' });
        grid[y][x] = TILE.empty;
      } else if (cell === TILE.pellet || cell === TILE.powerPellet) {
        pelletsRemaining += 1;
      }
    }
  }

  if (!player) {
    throw new Error('Maze is missing a player start position.');
  }

  return {
    grid,
    playerStart: clonePosition(player),
    player,
    ghosts,
    score: 0,
    lives: 3,
    pelletsRemaining,
    status: 'playing',
    message: 'Eat all pellets and avoid the ghosts.',
  };
}

function tileAt(game, position) {
  return game.grid[position.y]?.[position.x] ?? TILE.wall;
}

function isWall(game, position) {
  return tileAt(game, position) === TILE.wall;
}

function nextPosition(position, direction) {
  const delta = DIRECTIONS[direction];
  if (!delta) return clonePosition(position);
  return { x: position.x + delta.x, y: position.y + delta.y };
}

function samePosition(a, b) {
  return a.x === b.x && a.y === b.y;
}

function movePlayer(game, direction) {
  if (game.status !== 'playing') return false;

  const destination = nextPosition(game.player, direction);
  if (isWall(game, destination)) return false;

  game.player = destination;
  eatPellet(game);
  resolveCollisions(game);
  return true;
}

function eatPellet(game) {
  const tile = tileAt(game, game.player);

  if (tile === TILE.pellet || tile === TILE.powerPellet) {
    game.score += tile === TILE.powerPellet ? 50 : 10;
    game.grid[game.player.y][game.player.x] = TILE.empty;
    game.pelletsRemaining -= 1;
  }

  if (game.pelletsRemaining === 0 && game.status === 'playing') {
    game.status = 'won';
    game.message = `You cleared the maze! Final score: ${game.score}`;
  }
}

function legalGhostDirections(game, ghost) {
  return Object.keys(DIRECTIONS).filter((direction) => !isWall(game, nextPosition(ghost.position, direction)));
}

function oppositeDirection(direction) {
  return {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  }[direction];
}

function chooseGhostDirection(game, ghost) {
  const legal = legalGhostDirections(game, ghost);
  if (legal.length === 0) return ghost.direction;

  const continuing = nextPosition(ghost.position, ghost.direction);
  if (!isWall(game, continuing) && Math.random() < 0.7) return ghost.direction;

  const reverse = oppositeDirection(ghost.direction);
  const choices = legal.length > 1 ? legal.filter((direction) => direction !== reverse) : legal;
  return choices[Math.floor(Math.random() * choices.length)];
}

function moveGhosts(game) {
  if (game.status !== 'playing') return;

  for (const ghost of game.ghosts) {
    ghost.direction = chooseGhostDirection(game, ghost);
    const destination = nextPosition(ghost.position, ghost.direction);
    if (!isWall(game, destination)) ghost.position = destination;
  }

  resolveCollisions(game);
}

function resolveCollisions(game) {
  if (game.status !== 'playing') return;

  if (!game.ghosts.some((ghost) => samePosition(ghost.position, game.player))) return;

  game.lives -= 1;
  if (game.lives <= 0) {
    game.status = 'lost';
    game.message = `Game over! Final score: ${game.score}`;
    return;
  }

  resetCharacters(game);
  game.message = `Caught by a ghost! ${game.lives} lives left.`;
}

function resetCharacters(game) {
  game.player = clonePosition(game.playerStart);
  for (const ghost of game.ghosts) {
    ghost.position = clonePosition(ghost.start);
    ghost.direction = 'left';
  }
}

function renderCell(cell) {
  return DISPLAY[cell] ?? cell;
}

function renderState(game) {
  const rows = game.grid.map((row) => row.slice());
  for (const ghost of game.ghosts) rows[ghost.position.y][ghost.position.x] = DISPLAY.ghost;
  rows[game.player.y][game.player.x] = DISPLAY.player;

  const mazeRows = rows.map((row) => `│${row.map(renderCell).join('')}│`);
  const border = `└${'─'.repeat(game.grid[0].length)}┘`;
  const topBorder = `┌${'─'.repeat(game.grid[0].length)}┐`;
  const status = game.status === 'playing' ? game.message : `${game.message} Press r to restart.`;

  return [
    'PAC-MAN',
    `Score ${game.score}  Lives ${game.lives}  Left ${game.pelletsRemaining}`,
    topBorder,
    ...mazeRows,
    border,
    'Move: arrows/WASD   r: restart   q: quit',
    status,
  ].join('\n');
}

function directionFromKey(input) {
  return {
    '\u001b[A': 'up',
    '\u001b[B': 'down',
    '\u001b[D': 'left',
    '\u001b[C': 'right',
    w: 'up',
    W: 'up',
    s: 'down',
    S: 'down',
    a: 'left',
    A: 'left',
    d: 'right',
    D: 'right',
  }[input];
}

function draw(game) {
  process.stdout.write('\u001b[?25l');
  process.stdout.write('\u001b[H\u001b[2J');
  process.stdout.write(`${renderState(game)}\n`);
}

function runInteractive() {
  let game = createGame();
  let lastDirection = 'left';
  let interval = null;

  function stop() {
    if (interval) clearInterval(interval);
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    process.stdout.write('\u001b[?25h');
  }

  function quit() {
    stop();
    process.stdout.write('\nThanks for playing!\n');
    process.exit(0);
  }

  function restart() {
    game = createGame();
    lastDirection = 'left';
    draw(game);
  }

  process.stdin.setEncoding('utf8');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (input) => {
    if (input === '\u0003' || input === 'q' || input === 'Q') quit();
    if (input === 'r' || input === 'R') {
      restart();
      return;
    }

    const direction = directionFromKey(input);
    if (direction) {
      lastDirection = direction;
      movePlayer(game, direction);
      draw(game);
    }
  });

  interval = setInterval(() => {
    if (game.status === 'playing') {
      movePlayer(game, lastDirection);
      moveGhosts(game);
    }
    draw(game);
  }, 350);

  process.on('SIGINT', quit);
  process.on('exit', stop);
  draw(game);
}

function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log(renderState(createGame()));
    console.log('Run in an interactive terminal to play.');
    return;
  }

  runInteractive();
}

if (require.main === module) {
  main();
}

module.exports = {
  createGame,
  movePlayer,
  moveGhosts,
  renderState,
  directionFromKey,
  DIRECTIONS,
};
