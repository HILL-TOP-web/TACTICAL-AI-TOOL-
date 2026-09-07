'use strict';

class JSONIngestion {
  constructor(options = {}) {
    this.strict = options.strict !== false;
  }

  parse(input) {
    if (typeof input === 'object' && input !== null) {
      return input;
    }

    if (typeof input !== 'string') {
      throw new TypeError('JSON input must be a string or object');
    }

    try {
      return JSON.parse(input);
    } catch (error) {
      if (this.strict) {
        throw new Error(`JSON parsing failed: ${error.message}`);
      }

      return null;
    }
  }

  parseArray(input) {
    const result = this.parse(input);

    if (!Array.isArray(result)) {
      throw new Error('Expected JSON array');
    }

    return result;
  }

  parseObject(input) {
    const result = this.parse(input);

    if (
      typeof result !== 'object' ||
      result === null ||
      Array.isArray(result)
    ) {
      throw new Error('Expected JSON object');
    }

    return result;
  }
}

module.exports = JSONIngestion;
