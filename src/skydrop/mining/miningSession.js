'use strict';

const MiningTimer = require('./miningTimer');

class MiningSession {
  constructor({
    userId,
    miningRate,
    rewards,
    levels
  }) {
    this.userId = userId;
    this.miningRate = miningRate;
    this.rewards = rewards;
    this.levels = levels;

    this.startedAt = null;
    this.stoppedAt = null;

    this.totalReward = 0;
    this.claimedReward = 0;

    this.speedMultiplier = 1;

    this.timer = new MiningTimer();
  }

  start() {
    if (this.timer.isRunning()) {
      throw new Error('Mining session already running');
    }

    this.startedAt = Date.now();
    this.stoppedAt = null;

    this.timer.start(() => {
      this.generateReward();
    });

    return this.getStatus();
  }

  stop() {
    if (!this.timer.isRunning()) {
      throw new Error('Mining session is not active');
    }

    this.generateReward();

    this.timer.stop();

    this.stoppedAt = Date.now();

    return this.getStatus();
  }

  generateReward() {
    if (!this.startedAt) {
      return 0;
    }

    const elapsed = Date.now() - this.startedAt;

    const reward = this.miningRate.calculateReward({
      elapsedMs: elapsed,
      multiplier: this.speedMultiplier
    });

    this.totalReward = reward;

    return reward;
  }

  claim() {
    this.generateReward();

    const available =
      this.totalReward - this.claimedReward;

    if (available <= 0) {
      return {
        userId: this.userId,
        claimed: 0,
        remaining: 0
      };
    }

    this.claimedReward += available;

    return {
      userId: this.userId,
      claimed: available,
      remaining: this.totalReward - this.claimedReward
    };
  }

  setSpeed(multiplier) {
    if (!this.levels.isValidMultiplier(multiplier)) {
      throw new Error('Invalid mining speed multiplier');
    }

    this.speedMultiplier = Number(multiplier);

    return {
      userId: this.userId,
      speedMultiplier: this.speedMultiplier
    };
  }

  getStatus() {
    this.generateReward();

    const pendingReward =
      this.totalReward - this.claimedReward;

    const level =
      this.levels.getLevel(this.totalReward);

    return {
      userId: this.userId,
      active: this.timer.isRunning(),
      startedAt: this.startedAt,
      stoppedAt: this.stoppedAt,
      totalReward: this.totalReward,
      claimedReward: this.claimedReward,
      pendingReward,
      speedMultiplier: this.speedMultiplier,
      level
    };
  }
}

module.exports = MiningSession;
