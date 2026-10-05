'use strict';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const TETROMINOES = Object.freeze({
  I: Object.freeze([
    Object.freeze([0, 0, 0, 0]),
    Object.freeze([1, 1, 1, 1]),
    Object.freeze([0, 0, 0, 0]),
    Object.freeze([0, 0, 0, 0]),
  ]),
  J: Object.freeze([
    Object.freeze([1, 0, 0]),
    Object.freeze([1, 1, 1]),
    Object.freeze([0, 0, 0]),
  ]),
  L: Object.freeze([
    Object.freeze([0, 0, 1]),
    Object.freeze([1, 1, 1]),
    Object.freeze([0, 0, 0]),
  ]),
  O: Object.freeze([
    Object.freeze([1, 1]),
    Object.freeze([1, 1]),
  ]),
  S: Object.freeze([
    Object.freeze([0, 1, 1]),
    Object.freeze([1, 1, 0]),
    Object.freeze([0, 0, 0]),
  ]),
  T: Object.freeze([
    Object.freeze([0, 1, 0]),
    Object.freeze([1, 1, 1]),
    Object.freeze([0, 0, 0]),
  ]),
  Z: Object.freeze([
    Object.freeze([1, 1, 0]),
    Object.freeze([0, 1, 1]),
    Object.freeze([0, 0, 0]),
  ]),
});

const PIECE_TYPES = Object.freeze(Object.keys(TETROMINOES));
const LINE_SCORES = Object.freeze([0, 100, 300, 500, 800]);

function createBoard(width = BOARD_WIDTH, height = BOARD_HEIGHT) {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => null));
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function randomPieceType(random = Math.random) {
  const value = random();
  const index = Math.min(PIECE_TYPES.length - 1, Math.floor(value * PIECE_TYPES.length));
  return PIECE_TYPES[index];
}

function createPiece(type, boardWidth = BOARD_WIDTH) {
  if (!TETROMINOES[type]) {
    throw new Error(`Unknown tetromino type: ${type}`);
  }

  const matrix = cloneMatrix(TETROMINOES[type]);

  return {
    type,
    matrix,
    x: Math.floor((boardWidth - matrix[0].length) / 2),
    y: 0,
  };
}

function createInitialState({
  random = Math.random,
  nextType,
  active,
  width = BOARD_WIDTH,
  height = BOARD_HEIGHT,
  board = createBoard(width, height),
  score = 0,
  linesCleared = 0,
} = {}) {
  const clonedBoard = cloneBoard(board);
  const activePiece = active
    ? withPiece(active, {})
    : createPiece(nextType || randomPieceType(random), boardWidth(clonedBoard));

  return {
    board: clonedBoard,
    active: activePiece,
    score,
    linesCleared,
    gameOver: collides(clonedBoard, activePiece),
    random,
  };
}

function occupiedCells(piece = {}) {
  const cells = [];
  const matrix = piece.matrix || [];

  matrix.forEach((row, rowIndex) => {
    row.forEach((filled, columnIndex) => {
      if (filled) {
        cells.push({
          x: piece.x + columnIndex,
          y: piece.y + rowIndex,
          type: piece.type,
        });
      }
    });
  });

  return cells;
}

function boardWidth(board) {
  return board[0] ? board[0].length : 0;
}

function boardHeight(board) {
  return board.length;
}

function collides(board, piece) {
  const width = boardWidth(board);
  const height = boardHeight(board);

  return occupiedCells(piece).some(({ x, y }) => {
    if (x < 0 || x >= width || y >= height) {
      return true;
    }
    if (y < 0) {
      return false;
    }
    return Boolean(board[y][x]);
  });
}

function withPiece(piece, changes) {
  return {
    ...piece,
    ...changes,
    matrix: changes.matrix ? cloneMatrix(changes.matrix) : cloneMatrix(piece.matrix),
  };
}

function movePiece(state, dx, dy) {
  if (state.gameOver) {
    return state;
  }

  const active = withPiece(state.active, {
    x: state.active.x + dx,
    y: state.active.y + dy,
  });

  if (collides(state.board, active)) {
    return state;
  }

  return { ...state, active };
}

function rotateMatrixClockwise(matrix) {
  const height = matrix.length;
  const width = matrix[0].length;
  return Array.from({ length: width }, (_, x) =>
    Array.from({ length: height }, (_, y) => matrix[height - y - 1][x])
  );
}

function rotatePiece(state) {
  if (state.gameOver || state.active.type === 'O') {
    return state;
  }

  const rotated = rotateMatrixClockwise(state.active.matrix);
  const kicks = [0, -1, 1, -2, 2];

  for (const kick of kicks) {
    const active = withPiece(state.active, {
      matrix: rotated,
      x: state.active.x + kick,
    });

    if (!collides(state.board, active)) {
      return { ...state, active };
    }
  }

  return state;
}

function mergePiece(board, piece) {
  const merged = cloneBoard(board);
  const width = boardWidth(board);
  const height = boardHeight(board);

  occupiedCells(piece).forEach(({ x, y, type }) => {
    if (y >= 0 && y < height && x >= 0 && x < width) {
      merged[y][x] = type;
    }
  });

  return merged;
}

function clearLines(board) {
  const width = boardWidth(board);
  const remainingRows = board.filter((row) => row.some((cell) => !cell));
  const cleared = boardHeight(board) - remainingRows.length;
  const emptyRows = Array.from({ length: cleared }, () => Array.from({ length: width }, () => null));

  return {
    board: [...emptyRows, ...remainingRows],
    cleared,
  };
}

function scoreForLines(cleared) {
  return LINE_SCORES[cleared] || 0;
}

function lockPiece(state) {
  if (state.gameOver) {
    return state;
  }

  const merged = mergePiece(state.board, state.active);
  const { board, cleared } = clearLines(merged);
  const active = createPiece(randomPieceType(state.random), boardWidth(board));
  const gameOver = collides(board, active);

  return {
    ...state,
    board,
    active,
    score: state.score + scoreForLines(cleared),
    linesCleared: state.linesCleared + cleared,
    gameOver,
  };
}

function softDrop(state) {
  const moved = movePiece(state, 0, 1);
  return moved === state ? lockPiece(state) : moved;
}

function hardDrop(state) {
  let current = state;
  let next = movePiece(current, 0, 1);

  while (next !== current) {
    current = next;
    next = movePiece(current, 0, 1);
  }

  return lockPiece(current);
}

function stepGame(state, action) {
  switch (action) {
    case 'left':
      return movePiece(state, -1, 0);
    case 'right':
      return movePiece(state, 1, 0);
    case 'down':
    case 'tick':
      return softDrop(state);
    case 'rotate':
      return rotatePiece(state);
    case 'drop':
      return hardDrop(state);
    default:
      return state;
  }
}

module.exports = {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TETROMINOES,
  PIECE_TYPES,
  createBoard,
  createInitialState,
  createPiece,
  randomPieceType,
  boardHeight,
  boardWidth,
  occupiedCells,
  collides,
  movePiece,
  rotateMatrixClockwise,
  rotatePiece,
  mergePiece,
  clearLines,
  scoreForLines,
  softDrop,
  hardDrop,
  lockPiece,
  stepGame,
};
