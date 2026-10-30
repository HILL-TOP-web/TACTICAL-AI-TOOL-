'use strict';

const MiningRate = require('./miningRate');

class MiningLevels {

    static getLevel(level) {

        if (!Number.isInteger(level) ||
            level < 0 ||
            level >= MiningRate.INTERVALS.length) {
            throw new Error('Invalid mining level.');
        }

        return {
            level,
            intervalSeconds:
                MiningRate.getInterval(level)
        };
    }

    static canUpgrade(currentLevel) {
        return Number.isInteger(currentLevel) &&
            currentLevel >= 0 &&
            currentLevel < MiningRate.INTERVALS.length - 1;
    }

    static upgrade(currentLevel) {

        if (!this.canUpgrade(currentLevel)) {
            throw new Error(
                'Mining level cannot be upgraded.'
            );
        }

        return this.getLevel(currentLevel + 1);
    }
}

module.exports = MiningLevels;
