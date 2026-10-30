'use strict';

const MiningRate = Object.freeze({

    STARTING_REWARD: 0.00001,

    INTERVALS: Object.freeze([
        300,
        180,
        60,
        30,
        10,
        1
    ]),

    FOLLOW_TIKTOK_REWARD: 0.0004,

    getInterval(level = 0) {

        if (!Number.isInteger(level) ||
            level < 0 ||
            level >= this.INTERVALS.length) {
            throw new Error('Invalid mining level.');
        }

        return this.INTERVALS[level];
    },

    getReward() {
        return this.STARTING_REWARD;
    }
});

module.exports = MiningRate;
