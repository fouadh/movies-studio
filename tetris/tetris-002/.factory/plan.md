# Plan

- [x] Set up `npm start` to launch the terminal Tetris game.
  - [x] `src/index.js` auto-starts on import and exports nothing, preventing side-effect-free unit tests.
  - [x] Terminal I/O is hard-coded to process.stdin/stdout instead of injectable streams, making behavior difficult to test.
  - [ ] Render and exit behavior are not exposed as isolated units, so output and cleanup cannot be tested directly.
- [ ] Implement the core Tetris game state: board, pieces, movement, rotation, collision, locking, line clearing, score, and game over.
  - [ ] start() creates a random initial state internally with no injection point, making startup rendering tests nondeterministic.
  - [ ] Several core helpers hard-code BOARD_WIDTH/BOARD_HEIGHT despite createBoard/createPiece accepting custom sizes, forcing large 10x20 fixtures and making focused unit tests harder.
- [ ] Build terminal input handling for player controls.
- [ ] Render the complete game display in the terminal, including board, score, controls, borders, and game-over messages.
- [ ] Ensure the full display stays within 24 terminal rows.
