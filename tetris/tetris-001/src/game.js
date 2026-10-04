export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const TETROMINOES = {
  I: {
    cells: [
      [-1, 0],
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  },
  O: {
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  },
  T: {
    cells: [
      [-1, 0],
      [0, 0],
      [1, 0],
      [0, 1],
    ],
  },
  S: {
    cells: [
      [0, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
    ],
  },
  Z: {
    cells: [
      [-1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ],
  },
  J: {
    cells: [
      [-1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ],
  },
  L: {
    cells: [
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ],
  },
};

const PIECE_TYPES = Object.keys(TETROMINOES);
const LINE_CLEAR_POINTS = [0, 100, 300, 500, 800];

export function createBoard(width = BOARD_WIDTH, height = BOARD_HEIGHT) {
  return Array.from({ length: height }, () => Array(width).fill(null));
}

export function rotateCells(cells, direction = 1) {
  if (direction >= 0) {
    return cells.map(([x, y]) => [-y, x]);
  }
  return cells.map(([x, y]) => [y, -x]);
}

export class SevenBag {
  constructor(random = Math.random) {
    this.random = random;
    this.bag = [];
  }

  next() {
    if (this.bag.length === 0) {
      this.bag = [...PIECE_TYPES];
      for (let index = this.bag.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(this.random() * (index + 1));
        [this.bag[index], this.bag[swapIndex]] = [this.bag[swapIndex], this.bag[index]];
      }
    }

    return this.bag.pop();
  }
}

export class TetrisGame {
  constructor({ width = BOARD_WIDTH, height = BOARD_HEIGHT, random = Math.random } = {}) {
    this.width = width;
    this.height = height;
    this.board = createBoard(width, height);
    this.queue = new SevenBag(random);
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.activePiece = null;
    this.spawnPiece();
  }

  spawnPiece(type = this.queue.next()) {
    const definition = TETROMINOES[type];
    if (!definition) {
      throw new Error(`Unknown tetromino: ${type}`);
    }

    this.activePiece = {
      type,
      x: Math.floor(this.width / 2),
      y: 0,
      cells: definition.cells.map(([x, y]) => [x, y]),
    };

    if (this.collides(this.activePiece)) {
      this.gameOver = true;
    }

    return this.activePiece;
  }

  getActiveCells(piece = this.activePiece) {
    if (!piece) return [];
    return piece.cells.map(([x, y]) => [piece.x + x, piece.y + y]);
  }

  collides(piece) {
    return this.getActiveCells(piece).some(([x, y]) => {
      if (x < 0 || x >= this.width || y >= this.height) return true;
      if (y < 0) return false;
      return this.board[y][x] !== null;
    });
  }

  move(deltaX, deltaY) {
    if (this.gameOver || !this.activePiece) return false;

    const candidate = {
      ...this.activePiece,
      x: this.activePiece.x + deltaX,
      y: this.activePiece.y + deltaY,
    };

    if (this.collides(candidate)) {
      return false;
    }

    this.activePiece = candidate;
    return true;
  }

  moveLeft() {
    return this.move(-1, 0);
  }

  moveRight() {
    return this.move(1, 0);
  }

  softDrop() {
    if (this.move(0, 1)) {
      this.score += 1;
      return true;
    }

    this.lockPiece();
    return false;
  }

  hardDrop() {
    if (this.gameOver || !this.activePiece) return 0;

    let distance = 0;
    while (this.move(0, 1)) {
      distance += 1;
    }

    this.score += distance * 2;
    this.lockPiece();
    return distance;
  }

  rotate(direction = 1) {
    if (this.gameOver || !this.activePiece) return false;

    const rotatedCells = rotateCells(this.activePiece.cells, direction);
    const kicks = [0, -1, 1, -2, 2];

    for (const kick of kicks) {
      const candidate = {
        ...this.activePiece,
        x: this.activePiece.x + kick,
        cells: rotatedCells,
      };

      if (!this.collides(candidate)) {
        this.activePiece = candidate;
        return true;
      }
    }

    return false;
  }

  tick() {
    if (this.gameOver) return false;
    if (this.move(0, 1)) return true;
    this.lockPiece();
    return false;
  }

  lockPiece() {
    if (!this.activePiece) return;

    for (const [x, y] of this.getActiveCells()) {
      if (y < 0) {
        this.gameOver = true;
        continue;
      }
      this.board[y][x] = this.activePiece.type;
    }

    const cleared = this.clearLines();
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
    this.score += LINE_CLEAR_POINTS[cleared] * this.level;
    this.activePiece = null;

    if (!this.gameOver) {
      this.spawnPiece();
    }
  }

  clearLines() {
    const remainingRows = this.board.filter((row) => row.some((cell) => cell === null));
    const cleared = this.height - remainingRows.length;

    while (remainingRows.length < this.height) {
      remainingRows.unshift(Array(this.width).fill(null));
    }

    this.board = remainingRows;
    return cleared;
  }

  snapshot() {
    const cells = this.board.map((row) => [...row]);

    for (const [x, y] of this.getActiveCells()) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        cells[y][x] = this.activePiece.type;
      }
    }

    return {
      board: cells,
      score: this.score,
      lines: this.lines,
      level: this.level,
      gameOver: this.gameOver,
      activePiece: this.activePiece ? { ...this.activePiece, cells: this.activePiece.cells.map((cell) => [...cell]) } : null,
    };
  }
}
