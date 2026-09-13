'use strict';

class MiningAnalytics {
  constructor(options = {}) {
    this.records = options.records || new Map();
  }

  /**
   * Create analytics record for a user.
   */
  create(userId) {
    this.validateUserId(userId);

    if (this.records.has(userId)) {
      return this.get(userId);
    }

    const now = new Date().toISOString();

    const record = {
      userId,

      totalMined: 0,
      totalSessions: 0,
      activeSessions: 0,
      completedSessions: 0,

      totalMiningTimeSeconds: 0,

      averageSessionReward: 0,
      highestSessionReward: 0,

      tasksCompleted: 0,
      miningEvents: 0,

      firstMiningAt: null,
      lastMiningAt: null,

      createdAt: now,
      updatedAt: now
    };

    this.records.set(userId, record);

    return this.get(userId);
  }

  /**
   * Get analytics record.
   */
  get(userId) {
    this.validateUserId(userId);

    if (!this.records.has(userId)) {
      return this.create(userId);
    }

    return this.clone(
      this.records.get(userId)
    );
  }

  /**
   * Record a mining event.
   */
  recordMining({
    userId,
    amount = 0,
    durationSeconds = 0,
    sessionCompleted = false
  }) {
    this.validateUserId(userId);

    const record =
      this.ensureRecord(userId);

    const minedAmount = Number(amount);
    const duration = Number(durationSeconds);

    if (
      !Number.isFinite(minedAmount) ||
      minedAmount < 0
    ) {
      throw new Error(
        'Invalid mining amount.'
      );
    }

    if (
      !Number.isFinite(duration) ||
      duration < 0
    ) {
      throw new Error(
        'Invalid mining duration.'
      );
    }

    const now =
      new Date().toISOString();

    record.totalMined += minedAmount;
    record.totalMiningTimeSeconds += duration;
    record.miningEvents += 1;

    if (sessionCompleted) {
      record.totalSessions += 1;
      record.completedSessions += 1;

      if (minedAmount > 0) {
        if (
          minedAmount >
          record.highestSessionReward
        ) {
          record.highestSessionReward =
            minedAmount;
        }
      }

      record.averageSessionReward =
        record.completedSessions > 0
          ? record.totalMined /
            record.completedSessions
          : 0;
    }

    if (!record.firstMiningAt) {
      record.firstMiningAt = now;
    }

    record.lastMiningAt = now;
    record.updatedAt = now;

    this.records.set(userId, record);

    return this.get(userId);
  }

  /**
   * Register a mining session starting.
   */
  sessionStarted(userId) {
    const record =
      this.ensureRecord(userId);

    record.activeSessions += 1;
    record.updatedAt =
      new Date().toISOString();

    this.records.set(userId, record);

    return this.get(userId);
  }

  /**
   * Register a mining session ending.
   */
  sessionEnded(
    userId,
    reward = 0,
    durationSeconds = 0
  ) {
    const record =
      this.ensureRecord(userId);

    if (record.activeSessions > 0) {
      record.activeSessions -= 1;
    }

    return this.recordMining({
      userId,
      amount: reward,
      durationSeconds,
      sessionCompleted: true
    });
  }

  /**
   * Record completed mining task.
   */
  taskCompleted(userId) {
    const record =
      this.ensureRecord(userId);

    record.tasksCompleted += 1;
    record.updatedAt =
      new Date().toISOString();

    this.records.set(userId, record);

    return this.get(userId);
  }

  /**
   * Calculate mining rate.
   */
  getMiningRate(userId) {
    const record =
      this.get(userId);

    if (
      record.totalMiningTimeSeconds <= 0
    ) {
      return 0;
    }

    return (
      record.totalMined /
      record.totalMiningTimeSeconds
    );
  }

  /**
   * Return dashboard summary.
   */
  getSummary(userId) {
    const record =
      this.get(userId);

    return {
      userId,
      totalMined: record.totalMined,
      totalSessions: record.totalSessions,
      activeSessions: record.activeSessions,
      completedSessions:
        record.completedSessions,
      totalMiningTimeSeconds:
        record.totalMiningTimeSeconds,
      averageSessionReward:
        record.averageSessionReward,
      highestSessionReward:
        record.highestSessionReward,
      tasksCompleted:
        record.tasksCompleted,
      miningEvents:
        record.miningEvents,
      miningRate:
        this.getMiningRate(userId),
      firstMiningAt:
        record.firstMiningAt,
      lastMiningAt:
        record.lastMiningAt
    };
  }

  /**
   * Validate user ID.
   */
  validateUserId(userId) {
    if (
      typeof userId !== 'string' ||
      userId.trim().length === 0
    ) {
      throw new Error(
        'Valid user ID is required.'
      );
    }
  }

  /**
   * Ensure a record exists.
   */
  ensureRecord(userId) {
    if (!this.records.has(userId)) {
      this.create(userId);
    }

    return this.records.get(userId);
  }

  /**
   * Clone object.
   */
  clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }
}

module.exports = MiningAnalytics;
