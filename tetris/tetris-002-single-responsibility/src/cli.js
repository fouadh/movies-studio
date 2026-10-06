import { startGame } from './game.js';
import { createTerminal } from './terminal.js';

export function runTetrisCli({ terminal = createTerminal(), exit = process.exit } = {}) {
  startGame({ terminal, exit });
}
