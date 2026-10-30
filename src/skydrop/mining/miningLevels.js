'use strict';

const MINING_LEVELS = Object.freeze([
    {
        level: 1,
        name: 'Starter',
        requiredSeconds: 0
    },
    {
        level: 2,
        name: 'Bronze',
        requiredSeconds: 86400
    },
    {
        level: 3,
        name: 'Silver',
        requiredSeconds: 604800
    },
    {
        level: 4,
        name: 'Gold',
        requiredSeconds: 2592000
    },
    {
        level: 5,
        name: 'Diamond',
        requiredSeconds: 7776000
    }
]);

function getMiningLevel(totalSeconds = 0) {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
        throw new Error('Invalid mining duration.');
    }

    let currentLevel = MINING_LEVELS[0];

    for (const level of MINING_LEVELS) {
        if (totalSeconds >= level.requiredSeconds) {
            currentLevel = level;
        } else {
            break;
        }
    }

    const nextLevel = MINING_LEVELS.find(
        level => level.level === currentLevel.level + 1
    );

    return {
        ...currentLevel,
        nextLevel: nextLevel || null,
        secondsToNextLevel: nextLevel
            ? Math.max(0, nextLevel.requiredSeconds - totalSeconds)
            : 0
    };
}

module.exports = {
    MINING_LEVELS,
    getMiningLevel
};
