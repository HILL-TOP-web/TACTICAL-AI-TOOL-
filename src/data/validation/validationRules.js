'use strict';

const ValidationRules = {
  latitude(value) {
    return (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= -90 &&
      value <= 90
    );
  },

  longitude(value) {
    return (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= -180 &&
      value <= 180
    );
  },

  timestamp(value) {
    if (typeof value !== 'string') {
      return false;
    }

    return !Number.isNaN(new Date(value).getTime());
  },

  confidence(value) {
    return (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 1
    );
  },

  nonEmptyString(value) {
    return (
      typeof value === 'string' &&
      value.trim().length > 0
    );
  }
};

module.exports = ValidationRules;
