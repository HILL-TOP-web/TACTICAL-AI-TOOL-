'use strict';

const MiningRate = require('./miningRate');

class MiningRewards {

    calculateReward(completedIntervals, level = 0) {

        if (!Number.isSafeInteger(completedIntervals) ||
            completedIntervals < 0) {
            throw new Error('Invalid completed intervals.');
        }

        const multiplier = 1;

        const reward =
            completedIntervals *
            MiningRate.getReward() *
            multiplier;

        return Number(reward.toFixed(12));
    }

    calculateFollowReward() {
        return MiningRate.FOLLOW_TIKTOK_REWARD;
    }
}

module.exports = new MiningRewards();
