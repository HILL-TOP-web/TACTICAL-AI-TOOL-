'use strict';

/**
 * Mining Validator
 *
 * Validates mining-related inputs before they reach
 * the mining engine, session, rate, or reward logic.
 */
class MiningValidator {
  /**
   * Validate a user ID.
   *
   * @param {*} userId
   * @returns {boolean}
   */
  static validateUserId(userId) {
    if (
      userId === undefined ||
      userId === null ||
      String(userId).trim() === ''
    ) {
      throw new Error('A valid userId is required');
    }

    return true;
  }

  /**
   * Validate mining speed multiplier.
   *
   * @param {*} multiplier
   * @param {number[]} allowedMultipliers
   * @returns {boolean}
   */
  static validateMultiplier(
    multiplier,
    allowedMultipliers = [1, 2, 5, 10, 30, 300]
  ) {
    const value = Number(multiplier);

    if (!Number.isFinite(value)) {
      throw new Error(
        'Mining multiplier must be a valid number'
      );
    }

    if (value <= 0) {
      throw new Error(
        'Mining multiplier must be greater than zero'
      );
    }

    if (!allowedMultipliers.includes(value)) {
      throw new Error(
        `Invalid mining multiplier. Allowed values: ${allowedMultipliers.join(', ')}`
      );
    }

    return true;
  }

  /**
   * Validate a mining rate.
   *
   * @param {*} rate
   * @returns {boolean}
   */
  static validateRate(rate) {
    const value = Number(rate);

    if (!Number.isFinite(value)) {
      throw new Error(
        'Mining rate must be a valid number'
      );
    }

    if (value <= 0) {
      throw new Error(
        'Mining rate must be greater than zero'
      );
    }

    return true;
  }

  /**
   * Validate mining interval.
   *
   * @param {*} intervalMs
   * @returns {boolean}
   */
  static validateInterval(intervalMs) {
    const value = Number(intervalMs);

    if (!Number.isFinite(value)) {
      throw new Error(
        'Mining interval must be a valid number'
      );
    }

    if (value <= 0) {
      throw new Error(
        'Mining interval must be greater than zero'
      );
    }

    return true;
  }

  /**
   * Validate a reward amount.
   *
   * @param {*} amount
   * @returns {boolean}
   */
  static validateReward(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      throw new Error(
        'Reward must be a valid number'
      );
    }

    if (value < 0) {
      throw new Error(
        'Reward cannot be negative'
      );
    }

    return true;
  }

  /**
   * Validate claim amount.
   *
   * @param {*} amount
   * @returns {boolean}
   */
  static validateClaimAmount(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      throw new Error(
        'Claim amount must be a valid number'
      );
    }

    if (value <= 0) {
      throw new Error(
        'Claim amount must be greater than zero'
      );
    }

    return true;
  }

  /**
   * Validate a complete mining configuration.
   *
   * @param {Object} config
   * @returns {boolean}
   */
  static validateConfig(config = {}) {
    const {
      baseRate,
      intervalMs
    } = config;

    this.validateRate(baseRate);
    this.validateInterval(intervalMs);

    return true;
  }

  /**
   * Validate a mining start request.
   *
   * @param {Object} data
   * @returns {boolean}
   */
  static validateStartRequest(data = {}) {
    this.validateUserId(data.userId);

    if (
      data.speedMultiplier !== undefined
    ) {
      this.validateMultiplier(
        data.speedMultiplier
      );
    }

    return true;
  }

  /**
   * Validate a mining stop request.
   *
   * @param {Object} data
   * @returns {boolean}
   */
  static validateStopRequest(data = {}) {
    this.validateUserId(data.userId);

    return true;
  }

  /**
   * Validate a mining claim request.
   *
   * @param {Object} data
   * @returns {boolean}
   */
  static validateClaimRequest(data = {}) {
    this.validateUserId(data.userId);

    if (data.amount !== undefined) {
      this.validateClaimAmount(data.amount);
    }

    return true;
  }

  /**
   * Validate a speed-change request.
   *
   * @param {Object} data
   * @param {number[]} allowedMultipliers
   * @returns {boolean}
   */
  static validateSpeedRequest(
    data = {},
    allowedMultipliers = [1, 2, 5, 10, 30, 300]
  ) {
    this.validateUserId(data.userId);

    this.validateMultiplier(
      data.multiplier,
      allowedMultipliers
    );

    return true;
  }

  /**
   * Sanitize a user ID.
   *
   * @param {*} userId
   * @returns {string}
   */
  static sanitizeUserId(userId) {
    this.validateUserId(userId);

    return String(userId).trim();
  }

  /**
   * Safely convert a numeric input.
   *
   * @param {*} value
   * @param {string} fieldName
   * @returns {number}
   */
  static toNumber(value, fieldName = 'value') {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      throw new Error(
        `${fieldName} must be a valid number`
      );
    }

    return number;
  }
}

module.exports = MiningValidator;
