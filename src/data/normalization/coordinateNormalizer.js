'use strict';

class CoordinateNormalizer {
  normalizeLatitude(value) {
    const latitude = Number(value);

    if (!Number.isFinite(latitude)) {
      throw new Error('Invalid latitude');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    return latitude;
  }

  normalizeLongitude(value) {
    const longitude = Number(value);

    if (!Number.isFinite(longitude)) {
      throw new Error('Invalid longitude');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    return longitude;
  }

  normalize(point) {
    if (!point || typeof point !== 'object') {
      throw new TypeError('Coordinate must be an object');
    }

    return {
      latitude: this.normalizeLatitude(
        point.latitude ?? point.lat
      ),
      longitude: this.normalizeLongitude(
        point.longitude ?? point.lon ?? point.lng
      )
    };
  }
}

module.exports = CoordinateNormalizer;
