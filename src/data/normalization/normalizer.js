'use strict';

class Normalizer {
  normalize(value) {
    if (Array.isArray(value)) {
      return value.map(item => this.normalize(item));
    }

    if (value && typeof value === 'object') {
      const result = {};

      for (const [key, item] of Object.entries(value)) {
        result[key] = this.normalize(item);
      }

      return result;
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    return value;
  }

  normalizeNumber(value) {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value.trim());

      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  normalizeBoolean(value) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();

      if (['true', 'yes', '1'].includes(normalized)) {
        return true;
      }

      if (['false', 'no', '0'].includes(normalized)) {
        return false;
      }
    }

    return null;
  }
}

module.exports = Normalizer;
