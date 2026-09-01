/**
 * mapProcessor.js
 *
 * Prepares terrain maps for simulation.
 */

class MapProcessor {
  constructor(options = {}) {
    this.defaultElevation =
      Number(
        options.defaultElevation ?? 0
      );

    this.defaultCover =
      options.defaultCover || "unknown";
  }

  /**
   * Normalize a map.
   */
  process(map = {}) {
    if (
      typeof map !== "object" ||
      map === null
    ) {
      throw new TypeError(
        "Map must be an object"
      );
    }

    const width =
      Number(map.width || 0);

    const height =
      Number(map.height || 0);

    const cells =
      this.normalizeGrid(
        map.cells || [],
        width,
        height
      );

    return {
      width,
      height,
      cells,

      metadata: {
        ...(map.metadata || {})
      },

      processedAt:
        new Date().toISOString()
    };
  }

  /**
   * Normalize map cells.
   */
  normalizeGrid(
    cells,
    width,
    height
  ) {
    const result = [];

    for (let y = 0; y < height; y++) {
      const row = [];

      for (let x = 0; x < width; x++) {
        const source =
          cells[y]?.[x] || {};

        row.push({
          x,
          y,

          elevation:
            Number(
              source.elevation ??
                this.defaultElevation
            ),

          cover:
            source.cover ||
            this.defaultCover,

          slope:
            Number(
              source.slope || 0
            ),

          obstacle:
            Boolean(
              source.obstacle
            )
        });
      }

      result.push(row);
    }

    return result;
  }

  /**
   * Get a cell.
   */
  getCell(map, x, y) {
    if (
      !map ||
      x < 0 ||
      y < 0 ||
      x >= map.width ||
      y >= map.height
    ) {
      return null;
    }

    return map.cells[y]?.[x] || null;
  }

  /**
   * Update a cell.
   */
  updateCell(
    map,
    x,
    y,
    updates = {}
  ) {
    const cell =
      this.getCell(map, x, y);

    if (!cell) {
      return false;
    }

    Object.assign(
      cell,
      updates
    );

    return true;
  }

  /**
   * Return basic map statistics.
   */
  statistics(map) {
    let total = 0;
    let elevationTotal = 0;
    let obstacles = 0;

    for (const row of map.cells || []) {
      for (const cell of row) {
        total++;

        elevationTotal +=
          Number(
            cell.elevation || 0
          );

        if (cell.obstacle) {
          obstacles++;
        }
      }
    }

    return {
      width: map.width,
      height: map.height,
      cells: total,

      averageElevation:
        total
          ? elevationTotal / total
          : 0,

      obstacles
    };
  }
}

module.exports = MapProcessor;
