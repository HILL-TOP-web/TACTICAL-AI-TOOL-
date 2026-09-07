'use strict';

const SchemaValidator = require('./schemaValidator');
const DataQuality = require('./dataQuality');
const ValidationRules = require('./validationRules');

class ValidationManager {
  constructor(options = {}) {
    this.schemaValidator =
      options.schemaValidator || new SchemaValidator();

    this.dataQuality =
      options.dataQuality || new DataQuality();

    this.rules = options.rules || ValidationRules;
  }

  validateSchema(data, schema) {
    return this.schemaValidator.validate(data, schema);
  }

  validateCoordinate(coordinate) {
    const errors = [];

    if (!coordinate) {
      return {
        valid: false,
        errors: ['Coordinate is required']
      };
    }

    if (!this.rules.latitude(coordinate.latitude)) {
      errors.push('Invalid latitude');
    }

    if (!this.rules.longitude(coordinate.longitude)) {
      errors.push('Invalid longitude');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateConfidence(value) {
    return {
      valid: this.rules.confidence(value),
      errors: this.rules.confidence(value)
        ? []
        : ['Confidence must be between 0 and 1']
    };
  }

  assessQuality(records) {
    return this.dataQuality.assess(records);
  }
}

module.exports = ValidationManager;
