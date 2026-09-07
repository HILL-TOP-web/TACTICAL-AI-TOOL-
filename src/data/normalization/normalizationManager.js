'use strict';

const Normalizer = require('./normalizer');
const TextNormalizer = require('./textNormalizer');
const CoordinateNormalizer = require('./coordinateNormalizer');
const TimestampNormalizer = require('./timestampNormalizer');

class NormalizationManager {
  constructor(options = {}) {
    this.normalizer = options.normalizer || new Normalizer();
    this.text = options.text || new TextNormalizer();
    this.coordinates =
      options.coordinates || new CoordinateNormalizer();
    this.timestamps =
      options.timestamps || new TimestampNormalizer();
  }

  normalize(data) {
    return this.normalizer.normalize(data);
  }

  normalizeText(text) {
    return this.text.normalize(text);
  }

  normalizeCoordinate(coordinate) {
    return this.coordinates.normalize(coordinate);
  }

  normalizeTimestamp(timestamp) {
    return this.timestamps.normalize(timestamp);
  }

  normalizeRecord(record) {
    if (!record || typeof record !== 'object') {
      throw new TypeError('Record must be an object');
    }

    const normalized = this.normalize(record);

    if (normalized.timestamp) {
      normalized.timestamp =
        this.normalizeTimestamp(normalized.timestamp);
    }

    if (normalized.latitude !== undefined &&
        normalized.longitude !== undefined) {
      const coordinate = this.normalizeCoordinate(normalized);

      normalized.latitude = coordinate.latitude;
      normalized.longitude = coordinate.longitude;
    }

    return normalized;
  }
}

module.exports = NormalizationManager;
