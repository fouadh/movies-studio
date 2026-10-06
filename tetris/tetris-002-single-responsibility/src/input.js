export function bindGameKeys(terminal, { quit, moveLeft, moveRight, softDrop, hardDrop, rotate }) {
  terminal.onInput((key) => {
    if (isQuitKey(key)) {
      quit();
      return;
    }

    if (key === '\u001b[D' || key === 'a') {
      moveLeft();
      return;
    }

    if (key === '\u001b[C' || key === 'd') {
      moveRight();
      return;
    }

    if (key === '\u001b[B' || key === 's') {
      softDrop();
      return;
    }

    if (key === '\u001b[A' || key === 'w') {
      rotate();
      return;
    }

    if (key === ' ') {
      hardDrop();
    }
  });
}

function isQuitKey(key) {
  return key === 'q' || key === '\u0003';
}
