'use strict';

class MiningTimer {

    static calculateElapsed(startedAt, now = new Date()) {

        const start = new Date(startedAt).getTime();
        const current = new Date(now).getTime();

        if (!Number.isFinite(start) ||
            !Number.isFinite(current) ||
            current < start) {
            throw new Error('Invalid mining timestamps.');
        }

        return Math.floor(
            (current - start) / 1000
        );
    }

    static calculateCompletedIntervals(
        startedAt,
        intervalSeconds,
        claimedIntervals = 0,
        now = new Date()
    ) {

        if (!Number.isInteger(intervalSeconds) ||
            intervalSeconds <= 0 ||
            !Number.isInteger(claimedIntervals) ||
            claimedIntervals < 0) {
            throw new Error('Invalid mining interval.');
        }

        const elapsed = this.calculateElapsed(
            startedAt,
            now
        );

        return Math.max(
            0,
            Math.floor(elapsed / intervalSeconds) -
            claimedIntervals
        );
    }
}

module.exports = MiningTimer;
