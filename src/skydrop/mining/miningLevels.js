'use strict';

class MiningLevels {
  constructor() {
    this.levels = [
      {
        level: 1,
        name: 'Starter',
        minimumReward: 0,
        multiplier: 1
      },
      {
        level: 2,
        name: 'Bronze',
        minimumReward: 0.001,
        multiplier: 1.1
      },
      {
        level: 3,
        name: 'Silver',
        minimumReward: 0.01,
        multiplier: 1.25
      },
      {
        level: 4,
        name: 'Gold',
        minimumReward: 0.1,
        multiplier: 1.5
      },
      {
        level: 5,
        name: 'Diamond',
        minimumReward: 1,
        multiplier: 2
      }
    ];

    this.allowedMultipliers = [
      1,
      2,
      5,
      10,
      30,
      300
    ];
  }

  getLevel(reward) {
    const amount = Number(reward);

    let current = this.levels[0];

    for (const level of this.levels) {
      if (amount >= level.minimumReward) {
        current = level;
      }
    }

    return {
      level: current.level,
      name: current.name,
      minimumReward: current.minimumReward,
      multiplier: current.multiplier
    };
  }

  getAllLevels() {
    return [...this.levels];
  }

  getLevelByNumber(levelNumber) {
    return this.levels.find(
      level => level.level === Number(levelNumber)
    ) || null;
  }

  isValidMultiplier(multiplier) {
    return this.allowedMultipliers.includes(
      Number(multiplier)
    );
  }

  getAllowedMultipliers() {
    return [...this.allowedMultipliers];
  }

  getMultiplierForLevel(levelNumber) {
    const level =
      this.getLevelByNumber(levelNumber);

    if (!level) {
      throw new Error('Mining level not found');
    }

    return level.multiplier;
  }
}

module.exports = MiningLevels;
