export function bindQuitKeys(terminal, quit) {
  terminal.onInput((key) => {
    if (isQuitKey(key)) {
      quit();
    }
  });
}

function isQuitKey(key) {
  return key === 'q' || key === '\u0003';
}
