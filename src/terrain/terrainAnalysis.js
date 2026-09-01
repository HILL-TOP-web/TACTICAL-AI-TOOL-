/**
 * terrainAnalysis.js
 *
 * General terrain analysis for a fictional
 * simulation environment.
 */

class TerrainAnalysis {
  constructor(options = {}) {
    this.landCover =
      options.landCover || null;

    this.elevation =
      options.elevation || null;
  }

  /**
   * Analyze one terrain cell.
   */
  analyzeCell(cell = {}) {
    const elevation =
      Number(
        cell.elevation || 0
      );

    const slope =
      Number(
        cell.slope || 0
      );

    const cover =
      cell.cover || "unknown";

    return {
      elevation,

      slope,

      cover,

      obstacle:
        Boolean(cell.obstacle),

      classification:
        this.classify(
          elevation,
          slope,
          cover
        )
    };
  }

  /**
   * General terrain classification.
   */
  classify(
    elevation,
    slope,
    cover
  ) {
    if (cover === "water") {
      return "water";
    }

    if (slope >= 30) {
      return "mountainous";
    }

    if (slope >= 15) {
      return "hilly";
    }

    if (slope >= 5) {
      return "rolling";
    }

    if (elevation < 20) {
      return "lowland";
    }

    return "flat";
  }

  /**
   * Analyze a complete map.
   */
  analyzeMap(map = {}) {
    const results = [];

    for (
      let y = 0;
      y < (map.height || 0);
      y++
    ) {
      const row = [];

      for (
        let x = 0;
        x < (map.width || 0);
        x++
      ) {
        const cell =
          map.cells?.[y]?.[x] || {};

        row.push(
          this.analyzeCell(cell)
        );
      }

      results.push(row);
    }

    return {
      width: map.width || 0,
      height: map.height || 0,
      cells: results,

      analyzedAt:
        new Date().toISOString()
    };
  }

  /**
   * Calculate basic terrain statistics.
   */
  statistics(map = {}) {
    const counts = {};

    let totalElevation = 0;
    let totalSlope = 0;
    let cells = 0;

    for (const row of map.cells || []) {
      for (const cell of row) {
        const result =
          this.analyzeCell(cell);

        const type =
          result.classification;

        counts[type] =
          (counts[type] || 0) + 1;

        totalElevation +=
          result.elevation;

        totalSlope +=
          result.slope;

        cells++;
      }
    }

    return {
      cells,

      averageElevation:
        cells
          ? totalElevation / cells
          : 0,

      averageSlope:
        cells
          ? totalSlope / cells
          : 0,

      terrainTypes: counts
    };
  }

  /**
   * Find cells matching a terrain type.
   */
  findByType(map, type) {
    const matches = [];

    for (
      let y = 0;
      y < (map.height || 0);
      y++
    ) {
      for (
        let x = 0;
        x < (map.width || 0);
        x++
      ) {
        const cell =
          map.cells?.[y]?.[x] || {};

        const result =
          this.analyzeCell(cell);

        if (
          result.classification === type
        ) {
          matches.push({
            x,
            y,
            ...result
          });
        }
      }
    }

    return matches;
  }
}

module.exports = TerrainAnalysis;
