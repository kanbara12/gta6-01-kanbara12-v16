// Keyboard input: WASD + arrows to drive, E to interact, F to shoot,
// H to hide the HUD, R to restart the current job, M to mute.

export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered, consumed by the game each frame
    this.onKeyDown = (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.key.toLowerCase());
      this.keys.add(event.key.toLowerCase());
    };
    this.onKeyUp = (event) => this.keys.delete(event.key.toLowerCase());
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  down(...names) {
    return names.some((name) => this.keys.has(name));
  }

  wasPressed(...names) {
    return names.some((name) => this.pressed.has(name));
  }

  endFrame() {
    this.pressed.clear();
  }

  get throttle() {
    return this.down('w', 'arrowup') ? 1 : this.down('s', 'arrowdown') ? -0.6 : 0;
  }

  get steer() {
    return (this.down('a', 'arrowleft') ? 1 : 0) - (this.down('d', 'arrowright') ? 1 : 0);
  }
}
