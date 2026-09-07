'use strict';

class SchemaValidator {
  validate(data, schema) {
    const errors = [];

    if (!schema || typeof schema !== 'object') {
      throw new TypeError('Schema must be an object');
    }

    if (
      schema.type &&
      !this.checkType(data, schema.type)
    ) {
      errors.push(`Expected type ${schema.type}`);
      return {
        valid: false,
        errors
      };
    }

    if (schema.required && typeof data === 'object') {
      for (const field of schema.required) {
        if (
          data[field] === undefined ||
          data[field] === null
        ) {
          errors.push(`${field} is required`);
        }
      }
    }

    if (schema.properties && data && typeof data === 'object') {
      for (const [field, fieldSchema] of Object.entries(
        schema.properties
      )) {
        if (data[field] !== undefined) {
          const result = this.validate(
            data[field],
            fieldSchema
          );

          if (!result.valid) {
            errors.push(
              ...result.errors.map(
                error => `${field}.${error}`
              )
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  checkType(value, type) {
    switch (type) {
      case 'array':
        return Array.isArray(value);

      case 'object':
        return (
          value !== null &&
          typeof value === 'object' &&
          !Array.isArray(value)
        );

      case 'number':
        return typeof value === 'number' &&
          Number.isFinite(value);

      default:
        return typeof value === type;
    }
  }
}

module.exports = SchemaValidator;
