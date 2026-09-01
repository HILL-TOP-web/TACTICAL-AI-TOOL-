/**
 * terrainClassification.js
 *
 * Classifies terrain cells for a controlled simulation.
 */

class TerrainClassification {
  constructor() {
    this.classes = {
      flat: {
        minSlope: 0,
        maxSlope: 5
      },

      rolling: {
        minSlope: 5,
        maxSlope: 15
      },

      hilly: {
        minSlope: 15,
        maxSlope: 30
      },

      mountainous: {
        minSlope: 30,
        maxSlope: Infinity
      }
    };
  }

  /**
   * Classify terrain using elevation/slope.
   */
  classifyBySlope(slope) {
    const value = Number(slope);

    if (!Number.isFinite(value)) {
      return "unknown";
    }

    for (const [name, range] of Object.entries(
      this.classes
    )) {
      if (
        value >= range.minSlope &&
        value < range.maxSlope
      ) {
        return name;
      }
    }

    return "unknown";
  }

  /**
   * Classify a terrain cell.
   */
  classifyCell(cell = {}) {
    const elevation =
      Number(cell.elevation || 0);

    const slope =
      Number(cell.slope || 0);

    const cover =
      cell.cover || "unknown";

    return {
      elevation,
      slope,
      cover,
      terrainType:
        this.classifyBySlope(slope)
    };
  }

  /**
   * Classify an entire terrain grid.
   */
  classifyGrid(grid = []) {
    if (!Array.isArray(grid)) {
      throw new TypeError(
        "Grid must be an array"
      );
    }

    return grid.map((row) =>
      Array.isArray(row)
        ? row.map((cell) =>
            this.classifyCell(cell)
          )
        : []
    );
  }

  /**
   * Get available terrain classes.
   */
  getClasses() {
    return Object.keys(
      this.classes
    );
  }
}

module.exports = TerrainClassification;
