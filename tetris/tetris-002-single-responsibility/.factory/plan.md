# Plan

- [x] Set up `npm start` to launch the terminal Tetris game.
  - [x] Fix finding: `src/index.js` has multiple responsibilities: board creation, display rendering, terminal I/O, input handling, and process lifecycle are all coupled in one module.
- [x] Render the complete game display in the terminal, including board, borders, score, controls, and game-over message.
- [x] Implement Tetris gameplay: falling pieces, movement, rotation, locking, line clears, scoring, and game over.
  - [x] Fix finding: `src/tetrominoes.js` mixes tetromino shape/movement responsibilities with board cell representation via `ACTIVE_CELL` and `LOCKED_CELL`.
- [x] Keep the entire display within 24 terminal rows.
- [x] Add any helpful terminal rendering or input packages if needed.
