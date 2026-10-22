'use strict';

const crypto = require('node:crypto');

const REWARD_TYPES = Object.freeze({
  SKD: 'skd',
  CASH: 'cash',
  PROMOTIONAL: 'promotional'
});

const REWARD_STATUSES = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
});

class RewardService {
  constructor(options = {}) {
    if (!options.db || typeof options.db.query !== 'function') {
      throw new Error('DATABASE_CONNECTION_REQUIRED');
    }

    this.db = options.db;

    // Inject existing authorized services where available.
    this.authorization = options.authorization || null;
    this.walletService = options.walletService || null;
    this.withdrawalService = options.withdrawalService || null;
    this.audit = options.audit || null;
    this.monnifyClient = options.monnifyClient || null;

    this.currency = options.currency || 'NGN';
    this.maxRewardAmount = Number(options.maxRewardAmount || 1000000);
  }

  /**
   * Check required environment variables without exposing their values.
   *
   * Monnify variables are required only when preparing a cash payout.
   * This checks configuration, not actual API connectivity.
   */
  checkEnvironment(options = {}) {
    const required = ['DATABASE_URL'];

    if (options.requireMonnify) {
      required.push(
        'MONNIFY_BASE_URL',
        'MONNIFY_API_KEY',
        'MONNIFY_SECRET_KEY',
        'MONNIFY_CONTRACT_CODE'
      );
    }

    const missing = required.filter((name) => {
      return (
        typeof process.env[name] !== 'string' ||
        process.env[name].trim().length === 0
      );
    });

    return {
      ok: missing.length === 0,
      missing
    };
  }

  /**
   * Ensure a trusted server-side authorization service approves the action.
   * Never trust roles or permissions supplied by the frontend.
   */
  async requirePermission(actor, permission) {
    if (!actor || !actor.id) {
      throw new Error('AUTHENTICATED_ACTOR_REQUIRED');
    }

    if (!this.authorization) {
      throw new Error('AUTHORIZATION_SERVICE_NOT_CONFIGURED');
    }

    if (typeof this.authorization.requirePermission === 'function') {
      await this.authorization.requirePermission(actor, permission);
      return;
    }

    if (typeof this.authorization.hasPermission === 'function') {
      const allowed = await this.authorization.hasPermission(
        actor,
        permission
      );

      if (!allowed) {
        throw new Error('FORBIDDEN');
      }

      return;
    }

    throw new Error('UNSUPPORTED_AUTHORIZATION_INTERFACE');
  }

  validateReward(input = {}) {
    const errors = [];

    const type = String(input.type || '').trim().toLowerCase();
    const amount = Number(input.amount);

    if (!Object.values(REWARD_TYPES).includes(type)) {
      errors.push('INVALID_REWARD_TYPE');
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push('INVALID_REWARD_AMOUNT');
    }

    if (Number.isFinite(amount) && amount > this.maxRewardAmount) {
      errors.push('REWARD_AMOUNT_EXCEEDS_LIMIT');
    }

    if (
      type === REWARD_TYPES.SKD &&
      Number.isFinite(amount) &&
      Math.round(amount * 100000000) !== amount * 100000000
    ) {
      errors.push('SKD_AMOUNT_MAX_8_DECIMAL_PLACES');
    }

    if (
      type === REWARD_TYPES.CASH &&
      input.currency &&
      String(input.currency).toUpperCase() !== this.currency
    ) {
      errors.push('UNSUPPORTED_CASH_REWARD_CURRENCY');
    }

    if (errors.length > 0) {
      const error = new Error('INVALID_REWARD');
