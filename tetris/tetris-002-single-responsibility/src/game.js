import {
  createInitialState,
  getVisibleBoard,
  hardDrop,
  moveActivePiece,
  rotateActivePiece,
  tick,
} from './gameplay.js';
import { bindGameKeys } from './input.js';
import { renderGameDisplay } from './renderer.js';
import { createTerminal } from './terminal.js';

const FALL_INTERVAL_MS = 500;

export function startGame({ terminal = createTerminal(), exit = () => {} } = {}) {
  let state = createInitialState();
  let fallTimer;

  function render() {
    terminal.draw(renderGameDisplay({ ...state, board: getVisibleBoard(state) }));
  }

  function update(nextState) {
    state = nextState;
    render();

    if (state.gameOver && fallTimer) {
      clearInterval(fallTimer);
      fallTimer = undefined;
    }
  }

  function quit() {
    if (fallTimer) {
      clearInterval(fallTimer);
    }
    terminal.disableRawInput();
    terminal.showCursor();
    exit(0);
  }

  terminal.hideCursor();
  render();

  if (!terminal.isInteractive()) {
    terminal.write('\nRun in a terminal to play.\n');
    terminal.showCursor();
    return;
  }

  terminal.enableRawInput();
  bindGameKeys(terminal, {
    quit,
    moveLeft: () => update(moveActivePiece(state, 'left')),
    moveRight: () => update(moveActivePiece(state, 'right')),
    softDrop: () => update(tick(state)),
    hardDrop: () => update(hardDrop(state)),
    rotate: () => update(rotateActivePiece(state)),
  });

  fallTimer = setInterval(() => update(tick(state)), FALL_INTERVAL_MS);
}
