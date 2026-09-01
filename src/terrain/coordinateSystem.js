/**
 * coordinateSystem.js
 *
 * Coordinate utilities for fictional simulation maps.
 *
 * Coordinates use:
 *
 * X → horizontal position
 * Y → vertical position
 * Z → elevation
 */

class CoordinateSystem {
  constructor(options = {}) {
    this.width =
      Number(options.width || 100);

    this.height =
      Number(options.height || 100);

    this.cellSize =
      Number(options.cellSize || 1);
  }

  /**
   * Validate a coordinate.
   */
  isValid(x, y) {
    return (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      x >= 0 &&
      y >= 0 &&
      x < this.width &&
      y < this.height
    );
  }

  /**
   * Create a coordinate.
   */
  create(x, y, z = 0) {
    if (!this.isValid(x, y)) {
      throw new RangeError(
        "Coordinate is outside the simulation map"
      );
    }

    return {
      x: Number(x),
      y: Number(y),
      z: Number(z) || 0
    };
  }

  /**
   * Convert a grid cell to simulation coordinates.
   */
  gridToWorld(x, y, elevation = 0) {
    if (!this.isValid(x, y)) {
      return null;
    }

    return {
      x: x * this.cellSize,
      y: y * this.cellSize,
      z: Number(elevation) || 0
    };
  }

  /**
   * Convert simulation coordinates to grid coordinates.
   */
  worldToGrid(x, y) {
    const gridX =
      Math.floor(
        Number(x) /
          this.cellSize
      );

    const gridY =
      Math.floor(
        Number(y) /
          this.cellSize
      );

    if (!this.isValid(gridX, gridY)) {
      return null;
    }

    return {
      x: gridX,
      y: gridY
    };
  }

  /**
   * Calculate distance between two
   * simulation coordinates.
   */
  distance(a, b) {
    if (!a || !b) {
      throw new TypeError(
        "Both coordinates are required"
      );
    }

    const dx =
      Number(b.x) -
      Number(a.x);

    const dy =
      Number(b.y) -
      Number(a.y);

    const dz =
      Number(b.z || 0) -
      Number(a.z || 0);

    return Math.sqrt(
      dx * dx +
      dy * dy +
      dz * dz
    );
  }

  /**
   * Calculate horizontal distance.
   */
  horizontalDistance(a, b) {
    const dx =
      Number(b.x) -
      Number(a.x);

    const dy =
      Number(b.y) -
      Number(a.y);

    return Math.sqrt(
      dx * dx +
      dy * dy
    );
  }

  /**
   * Check whether two cells are adjacent.
   */
  areAdjacent(a, b) {
    if (!a || !b) {
      return false;
    }

    const dx =
      Math.abs(a.x - b.x);

    const dy =
      Math.abs(a.y - b.y);

    return (
      dx <= 1 &&
      dy <= 1 &&
      !(dx === 0 && dy === 0)
    );
  }
}

module.exports = CoordinateSystem;
