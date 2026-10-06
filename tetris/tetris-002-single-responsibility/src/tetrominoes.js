const TETROMINOES = [
  {
    name: 'I',
    cells: [
      [[0, 1], [1, 1], [2, 1], [3, 1]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
    ],
  },
  {
    name: 'J',
    cells: [
      [[0, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [2, 2]],
      [[1, 0], [1, 1], [0, 2], [1, 2]],
    ],
  },
  {
    name: 'L',
    cells: [
      [[2, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[0, 1], [1, 1], [2, 1], [0, 2]],
      [[0, 0], [1, 0], [1, 1], [1, 2]],
    ],
  },
  {
    name: 'O',
    cells: [
      [[1, 0], [2, 0], [1, 1], [2, 1]],
    ],
  },
  {
    name: 'S',
    cells: [
      [[1, 0], [2, 0], [0, 1], [1, 1]],
      [[1, 0], [1, 1], [2, 1], [2, 2]],
    ],
  },
  {
    name: 'T',
    cells: [
      [[1, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [2, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [1, 2]],
      [[1, 0], [0, 1], [1, 1], [1, 2]],
    ],
  },
  {
    name: 'Z',
    cells: [
      [[0, 0], [1, 0], [1, 1], [2, 1]],
      [[2, 0], [1, 1], [2, 1], [1, 2]],
    ],
  },
];

export function createRandomPiece(random = Math.random) {
  const shape = TETROMINOES[Math.floor(random() * TETROMINOES.length)];

  return {
    shape,
    rotation: 0,
    x: 3,
    y: 0,
  };
}

export function getPieceCells(piece) {
  return piece.shape.cells[piece.rotation].map(([cellX, cellY]) => ({
    x: piece.x + cellX,
    y: piece.y + cellY,
  }));
}

export function movePiece(piece, { x = 0, y = 0 }) {
  return { ...piece, x: piece.x + x, y: piece.y + y };
}

export function rotatePiece(piece) {
  return {
    ...piece,
    rotation: (piece.rotation + 1) % piece.shape.cells.length,
  };
}
