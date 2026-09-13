'use strict';

const MiningSession = require('./miningSession');
const MiningRate = require('./miningRate');
const MiningRewards = require('./miningRewards');
const MiningLevels = require('./miningLevels');

class MiningEngine {
  constructor(options = {}) {
    this.baseRate = options.baseRate ?? 0.00001;
    this.intervalMs = options.intervalMs ?? 5 * 60 * 1000;

    this.rate = new MiningRate({
      baseRate: this.baseRate,
      intervalMs: this.intervalMs
    });

    this.rewards = new MiningRewards();
    this.levels = new MiningLevels();

    this.sessions = new Map();
  }

  start(userId) {
    this.validateUserId(userId);

    if (this.sessions.has(userId)) {
      throw new Error('Mining session already active');
    }

    const session = new MiningSession({
      userId,
      miningRate: this.rate,
      rewards: this.rewards,
      levels: this.levels
    });

    session.start();

    this.sessions.set(userId, session);

    return session.getStatus();
  }

  stop(userId) {
    const session = this.sessions.get(userId);

    if (!session) {
      throw new Error('No active mining session');
    }

    const result = session.stop();

    this.sessions.delete(userId);

    return result;
  }

  claim(userId) {
    const session = this.sessions.get(userId);

    if (!session) {
      throw new Error('No active mining session');
    }

    return session.claim();
  }

  getStatus(userId) {
    const session = this.sessions.get(userId);

    if (!session) {
      return {
        active: false,
        userId,
        pendingReward: 0
      };
    }

    return session.getStatus();
  }

  setSpeed(userId, multiplier) {
    const session = this.sessions.get(userId);

    if (!session) {
      throw new Error('No active mining session');
    }

    return session.setSpeed(multiplier);
  }

  validateUserId(userId) {
    if (
      userId === undefined ||
      userId === null ||
      String(userId).trim() === ''
    ) {
      throw new Error('userId is required');
    }
  }
}

module.exports = MiningEngine;
