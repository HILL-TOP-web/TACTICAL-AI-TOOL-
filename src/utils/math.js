/**
 * Tactical AI - Mathematical Utilities
 *
 * Provides reusable mathematical functions for:
 * terrain analysis,
 * simulation,
 * routing,
 * logistics,
 * scoring and decision support.
 */

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function inverseLerp(start, end, value) {
  if (start === end) {
    return 0;
  }

  return (value - start) / (end - start);
}

function normalize(value, min, max) {
  if (min === max) {
    return 0;
  }

  return clamp(
    (value - min) / (max - min),
    0,
    1
  );
}

function denormalize(value, min, max) {
  return min + value * (max - min);
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;

  return Math.round(
    (value + Number.EPSILON) * factor
  ) / factor;
}

function sum(values) {
  if (!Array.isArray(values)) {
    throw new TypeError("values must be an array");
  }

  return values.reduce(
    (total, value) => total + Number(value || 0),
    0
  );
}

function average(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  return sum(values) / values.length;
}

function min(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  return Math.min(...values);
}

function max(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  return Math.max(...values);
}

function distance2D(a, b) {
  if (
    !a ||
    !b ||
    typeof a.x !== "number" ||
    typeof a.y !== "number" ||
    typeof b.x !== "number" ||
    typeof b.y !== "number"
  ) {
    throw new TypeError(
      "Both points must contain numeric x and y values."
    );
  }

  const dx = b.x - a.x;
  const dy = b.y - a.y;

  return Math.sqrt(
    dx * dx + dy * dy
  );
}

function distance3D(a, b) {
  if (
    !a ||
    !b ||
    typeof a.x !== "number" ||
    typeof a.y !== "number" ||
    typeof a.z !== "number" ||
    typeof b.x !== "number" ||
    typeof b.y !== "number" ||
    typeof b.z !== "number"
  ) {
    throw new TypeError(
      "Both points must contain numeric x, y and z values."
    );
  }

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;

  return Math.sqrt(
    dx * dx +
    dy * dy +
    dz * dz
  );
}

function magnitude(vector) {
  if (!Array.isArray(vector)) {
    throw new TypeError(
      "vector must be an array"
    );
  }

  return Math.sqrt(
    vector.reduce(
      (total, value) =>
        total + value * value,
      0
    )
  );
}

function dot(a, b) {
  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    a.length !== b.length
  ) {
    throw new TypeError(
      "Vectors must be arrays of equal length."
    );
  }

  return a.reduce(
    (total, value, index) =>
      total + value * b[index],
    0
  );
}

function weightedAverage(values, weights) {
  if (
    !Array.isArray(values) ||
    !Array.isArray(weights) ||
    values.length !== weights.length ||
    values.length === 0
  ) {
    throw new TypeError(
      "Values and weights must be equal-length non-empty arrays."
    );
  }

  const totalWeight = sum(weights);

  if (totalWeight === 0) {
    return 0;
  }

  return values.reduce(
    (total, value, index) =>
      total + value * weights[index],
    0
  ) / totalWeight;
}

function percentage(part, total) {
  if (total === 0) {
    return 0;
  }

  return (part / total) * 100;
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

function bearing2D(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  const radians = Math.atan2(dx, dy);

  return (
    (radiansToDegrees(radians) + 360) %
    360
  );
}

function randomBetween(minValue, maxValue) {
  return (
    Math.random() *
      (maxValue - minValue) +
    minValue
  );
}

function randomInteger(minValue, maxValue) {
  return Math.floor(
    randomBetween(
      minValue,
      maxValue + 1
    )
  );
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function softmax(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const maxValue = Math.max(...values);

  const exponentials = values.map(
    value => Math.exp(value - maxValue)
  );

  const total = sum(exponentials);

  return exponentials.map(
    value => value / total
  );
}

module.exports = {
  clamp,
  lerp,
  inverseLerp,
  normalize,
  denormalize,
  round,
  sum,
  average,
  min,
  max,
  distance2D,
  distance3D,
  magnitude,
  dot,
  weightedAverage,
  percentage,
  degreesToRadians,
  radiansToDegrees,
  bearing2D,
  randomBetween,
  randomInteger,
  sigmoid,
  softmax
};
