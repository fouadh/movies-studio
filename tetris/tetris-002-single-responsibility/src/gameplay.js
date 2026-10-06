import {
  ACTIVE_CELL,
  LOCKED_CELL,
  clearCompletedLines,
  cloneBoard,
  createEmptyBoard,
  isCellEmpty,
  isInsideBoard,
} from './board.js';
import {
  createRandomPiece,
  getPieceCells,
  movePiece,
  rotatePiece,
} from './tetrominoes.js';

const LINE_SCORE = [0, 100, 300, 500, 800];

export function createInitialState({ random = Math.random } = {}) {
  const board = createEmptyBoard();
  const activePiece = createRandomPiece(random);

  return {
    board,
    activePiece,
    score: 0,
    lines: 0,
    gameOver: !canPlacePiece(board, activePiece),
  };
}

export function getVisibleBoard(state) {
  const visibleBoard = cloneBoard(state.board);

  if (state.activePiece && !state.gameOver) {
    for (const cell of getPieceCells(state.activePiece)) {
      if (isInsideBoard(visibleBoard, cell)) {
        visibleBoard[cell.y][cell.x] = ACTIVE_CELL;
      }
    }
  }

  return visibleBoard;
}

export function moveActivePiece(state, direction) {
  if (state.gameOver) {
    return state;
  }

  const movement = direction === 'left' ? { x: -1 } : { x: 1 };
  const movedPiece = movePiece(state.activePiece, movement);

  if (!canPlacePiece(state.board, movedPiece)) {
    return state;
  }

  return { ...state, activePiece: movedPiece };
}

export function rotateActivePiece(state) {
  if (state.gameOver) {
    return state;
  }

  const rotatedPiece = rotatePiece(state.activePiece);
  const kickedPiece = firstValidPiece(state.board, [
    rotatedPiece,
    movePiece(rotatedPiece, { x: -1 }),
    movePiece(rotatedPiece, { x: 1 }),
  ]);

  if (!kickedPiece) {
    return state;
  }

  return { ...state, activePiece: kickedPiece };
}

export function tick(state, { random = Math.random } = {}) {
  if (state.gameOver) {
    return state;
  }

  const droppedPiece = movePiece(state.activePiece, { y: 1 });

  if (canPlacePiece(state.board, droppedPiece)) {
    return { ...state, activePiece: droppedPiece };
  }

  return lockActivePiece(state, { random });
}

export function hardDrop(state, { random = Math.random } = {}) {
  if (state.gameOver) {
    return state;
  }

  let droppedPiece = state.activePiece;
  while (canPlacePiece(state.board, movePiece(droppedPiece, { y: 1 }))) {
    droppedPiece = movePiece(droppedPiece, { y: 1 });
  }

  return lockActivePiece({ ...state, activePiece: droppedPiece }, { random });
}

function lockActivePiece(state, { random }) {
  const lockedBoard = cloneBoard(state.board);

  for (const cell of getPieceCells(state.activePiece)) {
    if (isInsideBoard(lockedBoard, cell)) {
      lockedBoard[cell.y][cell.x] = LOCKED_CELL;
    }
  }

  const { board, cleared } = clearCompletedLines(lockedBoard);
  const activePiece = createRandomPiece(random);
  const gameOver = !canPlacePiece(board, activePiece);

  return {
    ...state,
    board,
    activePiece,
    gameOver,
    lines: state.lines + cleared,
    score: state.score + LINE_SCORE[cleared],
  };
}

function canPlacePiece(board, piece) {
  return getPieceCells(piece).every((cell) => isInsideBoard(board, cell) && isCellEmpty(board, cell));
}

function firstValidPiece(board, pieces) {
  return pieces.find((piece) => canPlacePiece(board, piece));
}
