'use strict';

class Validator {
  constructor() {
    this.errors = [];
  }

  reset() {
    this.errors = [];
  }

  required(value, field) {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      this.errors.push(`${field} is required`);
      return false;
    }

    return true;
  }

  type(value, field, expectedType) {
    if (value === undefined || value === null) {
      return true;
    }

    if (typeof value !== expectedType) {
      this.errors.push(
        `${field} must be of type ${expectedType}`
      );

      return false;
    }

    return true;
  }

  number(value, field) {
    if (
      value !== undefined &&
      value !== null &&
      (!Number.isFinite(value))
    ) {
      this.errors.push(`${field} must be a finite number`);
      return false;
    }

    return true;
  }

  range(value, field, min, max) {
    if (value === undefined || value === null) {
      return true;
    }

    if (value < min || value > max) {
      this.errors.push(
        `${field} must be between ${min} and ${max}`
      );

      return false;
    }

    return true;
  }

  isValid() {
    return this.errors.length === 0;
  }

  validate() {
    return {
      valid: this.isValid(),
      errors: [...this.errors]
    };
  }
}

module.exports = Validator;
