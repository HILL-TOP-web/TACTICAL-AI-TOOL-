/**
 * routeScoring.js
 *
 * Calculates a generic route quality score.
 *
 * Lower cost is generally better.
 */

class RouteScoring {
  constructor(options = {}) {
    this.weights = {
      distance: options.distanceWeight ?? 1,
      terrain: options.terrainWeight ?? 1,
      complexity: options.complexityWeight ?? 0.2,
      ...options.weights
    };
  }

  score(route) {
    const {
      path = [],
      waypoints = [],
      graph,
      terrainCost
    } = route;

    if (!graph) {
      throw new Error(
        "Graph is required for route scoring."
      );
    }

    const distance =
      this.calculateDistance(
        path,
        graph
      );

    const terrain =
      this.calculateTerrainCost(
        path,
        graph,
        terrainCost
      );

    const complexity =
      Math.max(0, waypoints.length - 2);

    const total =
      distance * this.weights.distance +
      terrain * this.weights.terrain +
      complexity * this.weights.complexity;

    return {
      total,
      distance,
      terrain,
      complexity,
      weights: {
        ...this.weights
      }
    };
  }

  calculateDistance(path, graph) {
    let distance = 0;

    for (let i = 1; i < path.length; i++) {
      distance += graph.distanceBetween(
        path[i - 1],
        path[i]
      );
    }

    return distance;
  }

  calculateTerrainCost(
    path,
    graph,
    terrainCost
  ) {
    if (!terrainCost) {
      return 0;
    }

    let total = 0;

    for (const nodeId of path) {
      const node = graph.getNode(nodeId);

      if (!node) {
        continue;
      }

      total += terrainCost.getCost(
        node.terrain
      );
    }

    return total;
  }

  rank(routes) {
    return [...routes].sort(
      (a, b) =>
        (a.score?.total ?? Infinity) -
        (b.score?.total ?? Infinity)
    );
  }
}

module.exports = RouteScoring;
