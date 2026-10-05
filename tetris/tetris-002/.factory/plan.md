# Plan

- [ ] Set up `npm start` to launch the terminal Tetris game.
  - [ ] `src/index.js` auto-starts on import and exports nothing, preventing side-effect-free unit tests.
  - [ ] Terminal I/O is hard-coded to process.stdin/stdout instead of injectable streams, making behavior difficult to test.
  - [ ] Render and exit behavior are not exposed as isolated units, so output and cleanup cannot be tested directly.
- [ ] Implement the core Tetris game state: board, pieces, movement, rotation, collision, locking, line clearing, score, and game over.
- [ ] Build terminal input handling for player controls.
- [ ] Render the complete game display in the terminal, including board, score, controls, borders, and game-over messages.
- [ ] Ensure the full display stays within 24 terminal rows.
