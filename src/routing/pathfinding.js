/**
 * pathfinding.js
 *
 * A* and Dijkstra pathfinding implementation.
 */

class MinHeap {
  constructor() {
    this.items = [];
  }

  push(item, priority) {
    this.items.push({ item, priority });
    this.bubbleUp(this.items.length - 1);
  }

  pop() {
    if (this.items.length === 0) {
      return null;
    }

    const root = this.items[0];
    const last = this.items.pop();

    if (this.items.length > 0) {
      this.items[0] = last;
      this.bubbleDown(0);
    }

    return root.item;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);

      if (
        this.items[parent].priority <=
        this.items[index].priority
      ) {
        break;
      }

      [this.items[parent], this.items[index]] =
        [this.items[index], this.items[parent]];

      index = parent;
    }
  }

  bubbleDown(index) {
    while (true) {
      const left = index * 2 + 1;
      const right = index * 2 + 2;

      let smallest = index;

      if (
        left < this.items.length &&
        this.items[left].priority <
          this.items[smallest].priority
      ) {
        smallest = left;
      }

      if (
        right < this.items.length &&
        this.items[right].priority <
          this.items[smallest].priority
      ) {
        smallest = right;
      }

      if (smallest === index) {
        break;
      }

      [this.items[index], this.items[smallest]] =
        [this.items[smallest], this.items[index]];

      index = smallest;
    }
  }

  get size() {
    return this.items.length;
  }
}

class Pathfinding {
  constructor(options = {}) {
    this.algorithm = options.algorithm || "astar";
  }

  findPath(graph, startId, goalId, options = {}) {
    if (!graph.hasNode(startId)) {
      return {
        found: false,
        reason: "START_NODE_NOT_FOUND",
        path: []
      };
    }

    if (!graph.hasNode(goalId)) {
      return {
        found: false,
        reason: "GOAL_NODE_NOT_FOUND",
        path: []
      };
    }

    const start = String(startId);
    const goal = String(goalId);

    if (start === goal) {
      return {
        found: true,
        path: [start],
        distance: 0,
        cost: 0,
        visited: 0
      };
    }

    const open = new MinHeap();

    const gScore = new Map();
    const fScore = new Map();
    const cameFrom = new Map();

    const closed = new Set();

    gScore.set(start, 0);

    const initialHeuristic =
      this.heuristic(graph, start, goal);

    fScore.set(start, initialHeuristic);

    open.push(start, initialHeuristic);

    let visited = 0;

    while (open.size > 0) {
      const current = open.pop();

      if (closed.has(current)) {
        continue;
      }

      visited++;

      if (current === goal) {
        const path = this.reconstructPath(
          cameFrom,
          current
        );

        return {
          found: true,
          path,
          distance: this.calculateDistance(graph, path),
          cost: gScore.get(current),
          visited
        };
      }

      closed.add(current);

      for (const edge of graph.getNeighbors(current)) {
        if (closed.has(edge.to)) {
          continue;
        }

        const neighbor = graph.getNode(edge.to);

        if (!neighbor || neighbor.blocked) {
          continue;
        }

        const terrainMultiplier =
          options.terrainCost
            ? options.terrainCost.getCost(
                neighbor.terrain,
                options
              )
            : 1;

        const extraPenalty =
          typeof options.additionalPenalty === "number"
            ? options.additionalPenalty
            : 0;

        const movementCost =
          edge.weight *
          terrainMultiplier +
          extraPenalty;

        const tentative =
          (gScore.get(current) ?? Infinity) +
          movementCost;

        if (
          tentative <
          (gScore.get(edge.to) ?? Infinity)
        ) {
          cameFrom.set(edge.to, current);
          gScore.set(edge.to, tentative);

          const heuristic =
            this.algorithm === "dijkstra"
              ? 0
              : this.heuristic(
                  graph,
                  edge.to,
                  goal
                );

          const total =
            tentative + heuristic;

          fScore.set(edge.to, total);

          open.push(edge.to, total);
        }
      }
    }

    return {
      found: false,
      reason: "NO_PATH",
      path: [],
      distance: Infinity,
      cost: Infinity,
      visited
    };
  }

  heuristic(graph, fromId, goalId) {
    return graph.distanceBetween(
      fromId,
      goalId
    );
  }

  reconstructPath(cameFrom, current) {
    const path = [current];

    while (cameFrom.has(current)) {
      current = cameFrom.get(current);
      path.unshift(current);
    }

    return path;
  }

  calculateDistance(graph, path) {
    let distance = 0;

    for (let i = 1; i < path.length; i++) {
      distance += graph.distanceBetween(
        path[i - 1],
        path[i]
      );
    }

    return distance;
  }
}

module.exports = Pathfinding;
