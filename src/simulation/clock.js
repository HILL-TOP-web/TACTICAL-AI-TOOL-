/**
 * clock.js
 *
 * Simulation clock.
 *
 * Supports:
 * - Pausing
 * - Resuming
 * - Time scaling
 * - Manual advancement
 * - Fixed simulation timestamps
 */

export class Clock {
    constructor(options = {}) {
        this.initialTime =
            options.startTime || Date.now();

        this.time = this.initialTime;

        this.timeScale =
            options.timeScale ?? 1;

        this.running = false;
    }

    now() {
        return this.time;
    }

    setTime(timestamp) {
        if (
            typeof timestamp !== "number" ||
            !Number.isFinite(timestamp)
        ) {
            throw new Error(
                "Clock timestamp must be a valid number"
            );
        }

        this.time = timestamp;

        return this.time;
    }

    advance(realDeltaMs) {
        if (
            typeof realDeltaMs !== "number" ||
            realDeltaMs < 0
        ) {
            throw new Error(
                "Delta must be a non-negative number"
            );
        }

        this.time +=
            realDeltaMs * this.timeScale;

        return this.time;
    }

    setTimeScale(scale) {
        if (
            typeof scale !== "number" ||
            scale < 0
        ) {
            throw new Error(
                "Time scale must be >= 0"
            );
        }

        this.timeScale = scale;

        return this;
    }

    getTimeScale() {
        return this.timeScale;
    }

    pause() {
        this.running = false;
    }

    resume() {
        this.running = true;
    }

    isPaused() {
        return !this.running;
    }

    reset() {
        this.time = this.initialTime;

        this.running = false;
    }

    toDate() {
        return new Date(this.time);
    }

    toISOString() {
        return this.toDate().toISOString();
    }
          }
