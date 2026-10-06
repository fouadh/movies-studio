const CLEAR_SCREEN = '\x1b[2J\x1b[H';
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';

export function createTerminal({ stdin = process.stdin, stdout = process.stdout } = {}) {
  return {
    isInteractive() {
      return Boolean(stdin.isTTY);
    },

    hideCursor() {
      stdout.write(HIDE_CURSOR);
    },

    showCursor() {
      stdout.write(SHOW_CURSOR);
    },

    draw(screen) {
      stdout.write(CLEAR_SCREEN);
      stdout.write(screen);
    },

    write(message) {
      stdout.write(message);
    },

    enableRawInput() {
      if (stdin.isTTY) {
        stdin.setRawMode(true);
      }
      stdin.resume();
      stdin.setEncoding('utf8');
    },

    disableRawInput() {
      if (stdin.isTTY) {
        stdin.setRawMode(false);
      }
    },

    onInput(handler) {
      stdin.on('data', handler);
    },
  };
}
