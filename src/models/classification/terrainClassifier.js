/**
 * Terrain Classifier
 * ------------------
 * Classifies terrain using supplied terrain attributes.
 *
 * This is a deterministic local model.
 */

class TerrainClassifier {
  classify(terrain = {}) {
    const {
      elevation = 0,
      slope = 0,
      vegetation = 0,
      water = false,
      urban = false,
      rocky = false
    } = terrain;

    let type = "open";
    let confidence = 0.60;

    if (water) {
      type = "water";
      confidence = 0.98;
    } else if (urban) {
      type = "urban";
      confidence = 0.95;
    } else if (rocky) {
      type = "rocky";
      confidence = 0.92;
    } else if (slope >= 30) {
      type = "mountainous";
      confidence = 0.90;
    } else if (slope >= 15) {
      type = "hilly";
      confidence = 0.85;
    } else if (vegetation >= 0.7) {
      type = "dense_vegetation";
      confidence = 0.88;
    } else if (vegetation >= 0.4) {
      type = "vegetated";
      confidence = 0.80;
    } else if (elevation > 1000) {
      type = "highland";
      confidence = 0.82;
    }

    return {
      type,
      confidence,
      attributes: {
        elevation,
        slope,
        vegetation,
        water,
        urban,
        rocky
      }
    };
  }
}

module.exports = TerrainClassifier;
