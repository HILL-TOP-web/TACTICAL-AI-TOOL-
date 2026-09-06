/**
 * terrainCost.js
 *
 * Converts terrain types into generic movement-cost multipliers.
 *
 * These are simulation values and can be replaced with your own
 * environment model.
 */

class TerrainCost {
  constructor(customCosts = {}) {
    this.costs = {
      normal: 1,
      road: 0.8,
      grass: 1.1,
      sand: 1.5,
      mud: 2.0,
      forest: 1.7,
      hill: 1.8,
      rock: 2.2,
      water: 3.0,
      ice: 2.5,
      ...customCosts
    };
  }

  getCost(terrain, options = {}) {
    const type =
      String(terrain || "normal")
        .toLowerCase();

    let cost =
      this.costs[type] ??
      this.costs.normal;

    if (
      options.terrainMultipliers &&
      Number.isFinite(
        options.terrainMultipliers[type]
      )
    ) {
      cost *=
        options.terrainMultipliers[type];
    }

    return Math.max(0.01, cost);
  }

  setCost(terrain, cost) {
    if (!Number.isFinite(cost) || cost <= 0) {
      throw new Error(
        "Terrain cost must be a positive number."
      );
    }

    this.costs[
      String(terrain).toLowerCase()
    ] = cost;

    return cost;
  }

  getAllCosts() {
    return {
      ...this.costs
    };
  }

  calculatePathCost(path, graph) {
    let total = 0;

    for (const nodeId of path) {
      const node = graph.getNode(nodeId);

      if (!node) {
        continue;
      }

      total += this.getCost(
        node.terrain
      );
    }

    return total;
  }
}

module.exports = TerrainCost;
