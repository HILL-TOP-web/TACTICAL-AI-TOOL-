/**
 * terrainParser.js
 *
 * Converts terrain JSON into
 * internal simulation structures.
 */

class TerrainParser {
  parse(rawTerrain) {
    return {
      width: rawTerrain.width || 0,
      height: rawTerrain.height || 0,

      cells:
        rawTerrain.cells || [],

      metadata:
        rawTerrain.metadata || {},

      loadedAt:
        new Date().toISOString()
    };
  }

  validate(terrain) {
    if (
      !terrain.width ||
      !terrain.height
    ) {
      return false;
    }

    if (
      !Array.isArray(terrain.cells)
    ) {
      return false;
    }

    return true;
  }

  getCell(terrain, x, y) {
    if (
      x < 0 ||
      y < 0 ||
      x >= terrain.width ||
      y >= terrain.height
    ) {
      return null;
    }

    return terrain.cells[y]?.[x] || null;
  }
}

module.exports = TerrainParser;
