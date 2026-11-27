// Keyboard and pointer input for a runner. Held keys steer (speed trim, duck);
// one-shot presses (jump, start/restart, pause) are queued as bit flags and
// taken once by the loop, so a press between two frames is never lost and never
// counted twice. The mouse plays too: click the upper part of the canvas to
// jump, press-and-hold the lower part to duck.

export const ACTION_JUMP = 1;
export const ACTION_CONFIRM = 2;
export const ACTION_PAUSE = 4;

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);
const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const CONFIRM_KEYS = new Set(['Enter']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);

export function createInput(canvas) {
  let left = false;
  let right = false;
  let duckHeld = false;
  let mouseDuck = false;
  let actions = 0;

  function pressJump() {
    actions |= ACTION_JUMP;
  }

  window.addEventListener('keydown', (event) => {
    if (JUMP_KEYS.has(event.code)) {
      if (!event.repeat) pressJump();
    } else if (DUCK_KEYS.has(event.code)) {
      duckHeld = true;
    } else if (LEFT_KEYS.has(event.code)) {
      left = true;
    } else if (RIGHT_KEYS.has(event.code)) {
      right = true;
    } else if (CONFIRM_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else {
      return;
    }
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (DUCK_KEYS.has(event.code)) duckHeld = false;
    else if (LEFT_KEYS.has(event.code)) left = false;
    else if (RIGHT_KEYS.has(event.code)) right = false;
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => {
    left = false;
    right = false;
    duckHeld = false;
    mouseDuck = false;
  });

  // Mouse: the upper part of the canvas jumps, the lower part ducks while held.
  // A right-click also ducks (and never opens the menu over the game).
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const y = (event.clientY - rect.top) / rect.height;
    if (event.button === 2 || y >= 0.55) {
      mouseDuck = true;
    } else {
      pressJump();
    }
    event.preventDefault();
  });
  window.addEventListener('pointerup', () => {
    mouseDuck = false;
  });
  window.addEventListener('pointercancel', () => {
    mouseDuck = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    /** -1 to run slower, 1 to run faster, 0 for neither or both. */
    speedTrim() {
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    /** True while a duck key or the lower mouse area is held. */
    ducking() {
      return duckHeld || mouseDuck;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
