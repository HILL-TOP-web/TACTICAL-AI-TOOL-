/**
 * routeEngine.js
 *
 * High-level routing coordinator.
 *
 * Responsibilities:
 * - Build/accept navigation graphs
 * - Calculate routes
 * - Score routes
 * - Compare alternative routes
 * - Simulate movement along a selected route
 */

const Graph = require("./graph");
const Pathfinding = require("./pathfinding");
const Waypoint = require("./waypoint");
const RouteScoring = require("./routeScoring");
const TerrainCost = require("./terrainCost");
const SimulatedMovement = require("./simulatedMovement");
const RouteComparison = require("./routeComparison");

class RouteEngine {
  constructor(options = {}) {
    this.options = {
      algorithm: options.algorithm || "astar",
      defaultTerrain: options.defaultTerrain || "normal",
      allowDiagonal: options.allowDiagonal !== false,
      ...options
    };

    this.graph = options.graph || new Graph({
      allowDiagonal: this.options.allowDiagonal
    });

    this.pathfinder = new Pathfinding({
      algorithm: this.options.algorithm
    });

    this.scorer = new RouteScoring(options.scoring);
    this.terrainCost = new TerrainCost(options.terrainCosts);
    this.movement = new SimulatedMovement(options.movement);
    this.comparator = new RouteComparison(options.comparison);
  }

  addNode(node) {
    return this.graph.addNode(node);
  }

  addEdge(fromId, toId, options = {}) {
    return this.graph.addEdge(fromId, toId, options);
  }

  buildGrid(grid, options = {}) {
    this.graph.buildGrid(grid, {
      allowDiagonal: this.options.allowDiagonal,
      ...options
    });

    return this.graph;
  }

  findRoute(startId, goalId, options = {}) {
    const result = this.pathfinder.findPath(
      this.graph,
      startId,
      goalId,
      {
        ...options,
        terrainCost: this.terrainCost
      }
    );

    if (!result.found) {
      return result;
    }

    const waypoints = Waypoint.fromPath(
      result.path,
      this.graph
    );

    const score = this.scorer.score({
      path: result.path,
      waypoints,
      graph: this.graph,
      terrainCost: this.terrainCost,
      ...options
    });

    return {
      ...result,
      waypoints,
      score
    };
  }

  findAlternativeRoutes(startId, goalId, options = {}) {
    const count = Math.max(1, options.count || 3);
    const routes = [];

    const first = this.findRoute(startId, goalId, options);

    if (!first.found) {
      return {
        routes: [],
        best: null
      };
    }

    routes.push(first);

    const penalties = options.alternativePenalty || 1.5;

    for (let i = 1; i < count; i++) {
      const route = this.findRoute(startId, goalId, {
        ...options,
        additionalPenalty: penalties * i
      });

      if (route.found) {
        routes.push(route);
      }
    }

    const comparison = this.comparator.compare(routes);

    return {
      routes,
      best: comparison.best,
      ranking: comparison.ranking
    };
  }

  simulateRoute(route, options = {}) {
    if (!route || !route.waypoints) {
      throw new Error("A valid route with waypoints is required.");
    }

    return this.movement.simulate(
      route.waypoints,
      options
    );
  }

  routeSummary(route) {
    if (!route) {
      return null;
    }

    return {
      found: Boolean(route.found),
      distance: route.distance ?? null,
      cost: route.cost ?? null,
      nodes: route.path?.length || 0,
      waypoints: route.waypoints?.length || 0,
      score: route.score?.total ?? null
    };
  }
}

module.exports = RouteEngine;
