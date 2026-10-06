import { cursorHide, cursorShow, cursorTo, eraseScreen } from 'ansi-escapes';

const CLEAR_SCREEN = `${eraseScreen}${cursorTo(0, 0)}`;

export function createTerminal({ stdin = process.stdin, stdout = process.stdout } = {}) {
  return {
    isInteractive() {
      return Boolean(stdin.isTTY);
    },

    hideCursor() {
      stdout.write(cursorHide);
    },

    showCursor() {
      stdout.write(cursorShow);
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
