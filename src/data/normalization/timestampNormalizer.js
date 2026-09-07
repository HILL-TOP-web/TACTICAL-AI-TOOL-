'use strict';

class TimestampNormalizer {
  normalize(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid timestamp: ${value}`);
    }

    return date.toISOString();
  }

  toUnixMilliseconds(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid timestamp: ${value}`);
    }

    return date.getTime();
  }

  isValid(value) {
    const date = new Date(value);

    return !Number.isNaN(date.getTime());
  }
}

module.exports = TimestampNormalizer;
