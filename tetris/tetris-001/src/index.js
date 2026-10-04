import { TetrisGame } from './game.js';

const game = new TetrisGame();
const snapshot = game.snapshot();

console.log(`Tetris core ready: ${snapshot.board[0].length}x${snapshot.board.length} board, score ${snapshot.score}`);
