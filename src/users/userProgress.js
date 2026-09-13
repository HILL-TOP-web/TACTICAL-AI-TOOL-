'use strict';

class UserProgress {
  constructor(options = {}) {
    this.progress = options.progress || new Map();

    this.defaultProgress = {
      level: 1,
      experience: 0,

      mining: {
        totalMined: 0,
        sessionsCompleted: 0,
        tasksCompleted: 0
      },

      social: {
        postsCreated: 0,
        commentsCreated: 0,
        followers: 0,
        following: 0
      },

      exchange: {
        swapsCompleted: 0,
        totalSKDSwapped: 0,
        totalUSDTSwapped: 0
      },

      achievements: [],

      createdAt: null,
      updatedAt: null
    };
  }

  /**
   * Create progress record.
   */
  create(userId) {
    this.validateUserId(userId);

    if (this.progress.has(userId)) {
      return this.get(userId);
    }

    const now = new Date().toISOString();

    const record = {
      ...this.clone(this.defaultProgress),
      createdAt: now,
      updatedAt: now
    };

    this.progress.set(userId, record);

    return this.get(userId);
  }

  /**
   * Get progress record.
   */
  get(userId) {
    this.validateUserId(userId);

    if (!this.progress.has(userId)) {
      return this.create(userId);
    }

    return this.clone(
      this.progress.get(userId)
    );
  }

  /**
   * Add experience points.
   */
  addExperience(userId, amount) {
    this.validateUserId(userId);

    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new Error(
        'Experience amount must be greater than zero.'
      );
    }

    const record =
      this.ensureRecord(userId);

    record.experience += value;

    /*
     * Simple level progression.
     *
     * Every 1,000 XP increases the level by one.
     */
    record.level =
      Math.floor(record.experience / 1000) + 1;

    record.updatedAt =
      new Date().toISOString();

    this.progress.set(userId, record);

    return this.get(userId);
  }

  /**
   * Record mining activity.
   */
  recordMining(
    userId,
    {
      minedAmount = 0,
      sessionCompleted = false,
      taskCompleted = false
    } = {}
  ) {
    const record =
      this.ensureRecord(userId);

    const amount = Number(minedAmount);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      throw new Error(
        'Invalid mined amount.'
      );
    }

    record.mining.totalMined += amount;

    if (sessionCompleted) {
      record.mining.sessionsCompleted += 1;
    }

    if (taskCompleted) {
      record.mining.tasksCompleted += 1;
    }

    record.updatedAt =
      new Date().toISOString();

    this.progress.set(userId, record);

    return this.get(userId);
  }

  /**
   * Record a social activity.
   */
  recordSocialActivity(
    userId,
    {
      post = false,
      comment = false,
      follower = false,
      following = false
    } = {}
  ) {
    const record =
      this.ensureRecord(userId);

    if (post) {
      record.social.postsCreated += 1;
    }

    if (comment) {
      record.social.commentsCreated += 1;
    }

    if (follower) {
      record.social.followers += 1;
    }

    if (following) {
      record.social.following += 1;
    }

    record.updatedAt =
      new Date().toISOString();

    this.progress.set(userId, record);

    return this.get(userId);
  }

  /**
   * Record a completed swap.
   */
  recordSwap(
    userId,
    {
      skdAmount = 0,
      usdtAmount = 0
    } = {}
  ) {
    const record =
      this.ensureRecord(userId);

    const skd = Number(skdAmount);
    const usdt = Number(usdtAmount);

    if (
      !Number.isFinite(skd) ||
      skd < 0
    ) {
      throw new Error(
        'Invalid SKD swap amount.'
      );
    }

    if (
      !Number.isFinite(usdt) ||
      usdt < 0
    ) {
      throw new Error(
        'Invalid USDT swap amount.'
      );
    }

    record.exchange.swapsCompleted += 1;
    record.exchange.totalSKDSwapped += skd;
    record.exchange.totalUSDTSwapped += usdt;

    record.updatedAt =
      new Date().toISOString();

    this.progress.set(userId, record);

    return this.get(userId);
  }

  /**
   * Add an achievement.
   */
  addAchievement(
    userId,
    achievement
  ) {
    const record =
      this.ensureRecord(userId);

    if (
      !achievement ||
      typeof achievement !== 'object'
    ) {
      throw new Error(
        'Achievement must be an object.'
      );
    }

    if (
      typeof achievement.id !== 'string' ||
      achievement.id.trim().length === 0
    ) {
      throw new Error(
        'Achievement ID is required.'
      );
    }

    const exists =
      record.achievements.some(
        item => item.id === achievement.id
      );

    if (!exists) {
      record.achievements.push({
        id: achievement.id,
        name: achievement.name || achievement.id,
        description: achievement.description || '',
        unlockedAt:
          new Date().toISOString()
      });
    }

    record.updatedAt =
      new Date().toISOString();

    this.progress.set(userId, record);

    return this.get(userId);
  }

  /**
   * Reset progress.
   */
  reset(userId) {
    this.validateUserId(userId);

    const now =
      new Date().toISOString();

    const record = {
      ...this.clone(this.defaultProgress),
      createdAt: now,
      updatedAt: now
    };

    this.progress.set(userId, record);

    return this.get(userId);
  }

  /**
   * Return a compact dashboard summary.
   */
  getSummary(userId) {
    const record =
      this.get(userId);

    return {
      userId,
      level: record.level,
      experience: record.experience,

      mining: {
        totalMined:
          record.mining.totalMined,
        sessionsCompleted:
          record.mining.sessionsCompleted,
        tasksCompleted:
          record.mining.tasksCompleted
      },

      social: {
        posts:
          record.social.postsCreated,
        comments:
          record.social.commentsCreated,
        followers:
          record.social.followers,
        following:
          record.social.following
      },

      exchange: {
        swaps:
          record.exchange.swapsCompleted,
        totalSKD:
          record.exchange.totalSKDSwapped,
        totalUSDT:
          record.exchange.totalUSDTSwapped
      },

      achievements:
        record.achievements.length
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

    return userId.trim();
  }

  /**
   * Make sure a progress record exists.
   */
  ensureRecord(userId) {
    this.validateUserId(userId);

    if (!this.progress.has(userId)) {
      this.create(userId);
    }

    return this.progress.get(userId);
  }

  /**
   * Deep clone an object.
   */
  clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }
}

module.exports = UserProgress;
