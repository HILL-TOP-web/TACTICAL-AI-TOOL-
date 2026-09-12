/**
 * Tactical AI - Validation Utilities
 *
 * General-purpose validation helpers used throughout
 * the application.
 */

const {
  ValidationError
} = require("./errors");

function isDefined(value) {
  return value !== undefined && value !== null;
}

function isString(value) {
  return typeof value === "string";
}

function isNonEmptyString(value) {
  return isString(value) && value.trim().length > 0;
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isInteger(value) {
  return Number.isInteger(value);
}

function isBoolean(value) {
  return typeof value === "boolean";
}

function isObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isArray(value) {
  return Array.isArray(value);
}

function isPositiveNumber(value) {
  return isNumber(value) && value > 0;
}

function isNonNegativeNumber(value) {
  return isNumber(value) && value >= 0;
}

function isPositiveInteger(value) {
  return isInteger(value) && value > 0;
}

function isNonNegativeInteger(value) {
  return isInteger(value) && value >= 0;
}

function isInRange(value, min, max) {
  return (
    isNumber(value) &&
    value >= min &&
    value <= max
  );
}

function isOneOf(value, allowedValues) {
  return allowedValues.includes(value);
}

function isValidCoordinate(value) {
  return (
    isObject(value) &&
    isNumber(value.x) &&
    isNumber(value.y)
  );
}

function isValidMapPosition(position, width, height) {
  if (!isValidCoordinate(position)) {
    return false;
  }

  return (
    position.x >= 0 &&
    position.x <= width &&
    position.y >= 0 &&
    position.y <= height
  );
}

function validateRequired(object, fields) {
  if (!isObject(object)) {
    throw new ValidationError(
      "Expected an object for validation."
    );
  }

  const errors = [];

  for (const field of fields) {
    if (
      !isDefined(object[field]) ||
      (isString(object[field]) &&
        object[field].trim() === "")
    ) {
      errors.push({
        field,
        message: `${field} is required`
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(
      "Required field validation failed.",
      errors
    );
  }

  return true;
}

function validateType(value, type, fieldName = "value") {
  let valid = true;

  switch (type) {
    case "string":
      valid = isString(value);
      break;

    case "number":
      valid = isNumber(value);
      break;

    case "integer":
      valid = isInteger(value);
      break;

    case "boolean":
      valid = isBoolean(value);
      break;

    case "object":
      valid = isObject(value);
      break;

    case "array":
      valid = isArray(value);
      break;

    default:
      throw new ValidationError(
        `Unknown validation type: ${type}`
      );
  }

  if (!valid) {
    throw new ValidationError(
      `${fieldName} must be a ${type}.`
    );
  }

  return true;
}

function assert(condition, message, details = null) {
  if (!condition) {
    throw new ValidationError(message, details);
  }

  return true;
}

function validateSchema(object, schema) {
  if (!isObject(object)) {
    throw new ValidationError(
      "Value must be an object."
    );
  }

  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = object[field];

    if (rules.required && !isDefined(value)) {
      errors.push({
        field,
        message: `${field} is required`
      });

      continue;
    }

    if (!isDefined(value)) {
      continue;
    }

    if (rules.type) {
      let validType = true;

      switch (rules.type) {
        case "string":
          validType = isString(value);
          break;

        case "number":
          validType = isNumber(value);
          break;

        case "integer":
          validType = isInteger(value);
          break;

        case "boolean":
          validType = isBoolean(value);
          break;

        case "object":
          validType = isObject(value);
          break;

        case "array":
          validType = isArray(value);
          break;

        default:
          errors.push({
            field,
            message: `Unknown type: ${rules.type}`
          });
          continue;
      }

      if (!validType) {
        errors.push({
          field,
          message: `${field} must be a ${rules.type}`
        });

        continue;
      }
    }

    if (
      rules.min !== undefined &&
      typeof value === "number" &&
      value < rules.min
    ) {
      errors.push({
        field,
        message: `${field} must be at least ${rules.min}`
      });
    }

    if (
      rules.max !== undefined &&
      typeof value === "number" &&
      value > rules.max
    ) {
      errors.push({
        field,
        message: `${field} must be at most ${rules.max}`
      });
    }

    if (
      rules.minLength !== undefined &&
      value.length < rules.minLength
    ) {
      errors.push({
        field,
        message: `${field} is too short`
      });
    }

    if (
      rules.maxLength !== undefined &&
      value.length > rules.maxLength
    ) {
      errors.push({
        field,
        message: `${field} is too long`
      });
    }

    if (
      rules.enum &&
      !rules.enum.includes(value)
    ) {
      errors.push({
        field,
        message: `${field} contains an invalid value`
      });
    }

    if (
      rules.pattern &&
      isString(value) &&
      !rules.pattern.test(value)
    ) {
      errors.push({
        field,
        message: `${field} has an invalid format`
      });
    }

    if (
      typeof rules.custom === "function" &&
      !rules.custom(value, object)
    ) {
      errors.push({
        field,
        message:
          rules.customMessage ||
          `${field} failed custom validation`
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(
      "Schema validation failed.",
      errors
    );
  }

  return true;
}

module.exports = {
  isDefined,
  isString,
  isNonEmptyString,
  isNumber,
  isInteger,
  isBoolean,
  isObject,
  isArray,
  isPositiveNumber,
  isNonNegativeNumber,
  isPositiveInteger,
  isNonNegativeInteger,
  isInRange,
  isOneOf,
  isValidCoordinate,
  isValidMapPosition,
  validateRequired,
  validateType,
  validateSchema,
  assert
};
