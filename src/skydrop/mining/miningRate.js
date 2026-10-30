'use strict';

const MINING_RATE = Object.freeze({
    INTERVAL_MS: 1000,
    REWARD_PER_SECOND: '0.000006',
    ASSET: 'SKD'
});

function getMiningRate() {
    return {
        intervalMs: MINING_RATE.INTERVAL_MS,
        rewardPerSecond: MINING_RATE.REWARD_PER_SECOND,
        asset: MINING_RATE.ASSET
    };
}

module.exports = {
    MINING_RATE,
    getMiningRate
};
