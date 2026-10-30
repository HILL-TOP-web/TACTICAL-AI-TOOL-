'use strict';

const { MINING_RATE } = require('./miningRate');

class MiningTimer {
    constructor(callback) {
        if (typeof callback !== 'function') {
            throw new TypeError('Mining timer requires a callback.');
        }

        this.callback = callback;
        this.interval = null;
        this.running = false;
        this.processing = false;
    }

    start() {
        if (this.running) {
            return false;
        }

        this.running = true;

        this.interval = setInterval(async () => {
            if (this.processing) {
                return;
            }

            this.processing = true;

            try {
                await this.callback();
            } catch (error) {
                console.error('Mining timer processing failed:', error.message);
            } finally {
                this.processing = false;
            }
        }, MINING_RATE.INTERVAL_MS);

        return true;
    }

    stop() {
        if (!this.running) {
            return false;
        }

        clearInterval(this.interval);

        this.interval = null;
        this.running = false;

        return true;
    }

    isRunning() {
        return this.running;
    }
}

module.exports = MiningTimer;
