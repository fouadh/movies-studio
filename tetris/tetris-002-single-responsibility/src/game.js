import { createEmptyBoard } from './board.js';
import { bindQuitKeys } from './input.js';
import { renderGameDisplay } from './renderer.js';
import { createTerminal } from './terminal.js';

export function startGame({ terminal = createTerminal(), exit = process.exit } = {}) {
  const state = createInitialState();

  function render() {
    terminal.draw(renderGameDisplay(state));
  }

  function quit() {
    terminal.disableRawInput();
    terminal.showCursor();
    exit(0);
  }

  terminal.hideCursor();
  render();

  if (!terminal.isInteractive()) {
    terminal.write('Run in a terminal to play.\n');
    terminal.showCursor();
    return;
  }

  terminal.enableRawInput();
  bindQuitKeys(terminal, quit);
}

function createInitialState() {
  return {
    board: createEmptyBoard(),
    score: 0,
    lines: 0,
  };
}
