'use strict';

class MiningTimer {
  constructor(intervalMs = 1000) {
    this.intervalMs = intervalMs;

    this.interval = null;
    this.running = false;
    this.callback = null;
  }

  start(callback) {
    if (this.running) {
      throw new Error('Timer is already running');
    }

    if (typeof callback !== 'function') {
      throw new TypeError('Timer callback must be a function');
    }

    this.callback = callback;
    this.running = true;

    this.interval = setInterval(() => {
      try {
        this.callback();
      } catch (error) {
        console.error(
          '[MiningTimer] Callback error:',
          error
        );
      }
    }, this.intervalMs);

    return true;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = null;
    this.running = false;
    this.callback = null;

    return true;
  }

  isRunning() {
    return this.running;
  }

  destroy() {
    this.stop();
  }
}

module.exports = MiningTimer;
