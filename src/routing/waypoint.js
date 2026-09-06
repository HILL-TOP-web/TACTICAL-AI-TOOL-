/**
 * waypoint.js
 *
 * Converts graph paths into waypoint objects.
 */

class Waypoint {
  constructor(options = {}) {
    this.id = options.id;
    this.x = Number(options.x ?? 0);
    this.y = Number(options.y ?? 0);

    this.terrain = options.terrain || "normal";

    this.order = Number(options.order ?? 0);

    this.arrivalTime =
      options.arrivalTime ?? null;

    this.metadata = options.metadata || {};
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      terrain: this.terrain,
      order: this.order,
      arrivalTime: this.arrivalTime,
      metadata: this.metadata
    };
  }

  static fromNode(node, order = 0) {
    return new Waypoint({
      id: node.id,
      x: node.x,
      y: node.y,
      terrain: node.terrain,
      order,
      metadata: node.metadata
    });
  }

  static fromPath(path, graph) {
    return path.map((nodeId, index) => {
      const node = graph.getNode(nodeId);

      if (!node) {
        throw new Error(
          `Unable to create waypoint for node ${nodeId}.`
        );
      }

      return Waypoint.fromNode(
        node,
        index
      );
    });
  }

  static distance(a, b) {
    return Math.hypot(
      b.x - a.x,
      b.y - a.y
    );
  }

  static totalDistance(waypoints) {
    let distance = 0;

    for (let i = 1; i < waypoints.length; i++) {
      distance += this.distance(
        waypoints[i - 1],
        waypoints[i]
      );
    }

    return distance;
  }

  static simplify(waypoints) {
    if (waypoints.length <= 2) {
      return waypoints;
    }

    const result = [
      waypoints[0]
    ];

    let previousDirection = null;

    for (let i = 1; i < waypoints.length; i++) {
      const previous =
        waypoints[i - 1];

      const current =
        waypoints[i];

      const dx =
        Math.sign(current.x - previous.x);

      const dy =
        Math.sign(current.y - previous.y);

      const direction = `${dx}:${dy}`;

      if (
        previousDirection !== null &&
        direction !== previousDirection
      ) {
        result.push(previous);
      }

      previousDirection = direction;
    }

    result.push(
      waypoints[waypoints.length - 1]
    );

    return result;
  }
}

module.exports = Waypoint;
