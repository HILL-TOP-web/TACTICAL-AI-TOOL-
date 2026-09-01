/**
 * terrainLoader.js
 *
 * Loads terrain files for simulation use.
 */

const fs = require("fs");
const path = require("path");

class TerrainLoader {
  constructor(basePath = "./data/terrain") {
    this.basePath = basePath;
  }

  load(fileName) {
    const fullPath = path.join(
      this.basePath,
      fileName
    );

    if (!fs.existsSync(fullPath)) {
      throw new Error(
        `Terrain file not found: ${fullPath}`
      );
    }

    const raw = fs.readFileSync(
      fullPath,
      "utf8"
    );

    return JSON.parse(raw);
  }

  exists(fileName) {
    return fs.existsSync(
      path.join(this.basePath, fileName)
    );
  }

  list() {
    return fs
      .readdirSync(this.basePath)
      .filter((f) => f.endsWith(".json"));
  }
}

module.exports = TerrainLoader;
