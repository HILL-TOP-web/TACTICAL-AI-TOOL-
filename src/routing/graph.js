/**
 * graph.js
 *
 * Generic weighted navigation graph.
 *
 * Nodes:
 * {
 *   id,
 *   x,
 *   y,
 *   terrain,
 *   blocked
 * }
 *
 * Edges:
 * {
 *   from,
 *   to,
 *   weight
 * }
 */

class Graph {
  constructor(options = {}) {
    this.nodes = new Map();
    this.edges = new Map();

    this.options = {
      allowDiagonal: options.allowDiagonal !== false
    };
  }

  addNode(node) {
    if (!node || node.id === undefined || node.id === null) {
      throw new Error("Node must contain an id.");
    }

    const normalized = {
      id: String(node.id),
      x: Number(node.x ?? 0),
      y: Number(node.y ?? 0),
      terrain: node.terrain || "normal",
      blocked: Boolean(node.blocked),
      metadata: node.metadata || {}
    };

    this.nodes.set(normalized.id, normalized);

    if (!this.edges.has(normalized.id)) {
      this.edges.set(normalized.id, []);
    }

    return normalized;
  }

  removeNode(id) {
    id = String(id);

    this.nodes.delete(id);
    this.edges.delete(id);

    for (const [nodeId, neighbors] of this.edges.entries()) {
      this.edges.set(
        nodeId,
        neighbors.filter(edge => edge.to !== id)
      );
    }

    return true;
  }

  getNode(id) {
    return this.nodes.get(String(id));
  }

  hasNode(id) {
    return this.nodes.has(String(id));
  }

  addEdge(fromId, toId, options = {}) {
    fromId = String(fromId);
    toId = String(toId);

    if (!this.hasNode(fromId) || !this.hasNode(toId)) {
      throw new Error("Both edge endpoints must exist.");
    }

    if (this.getNode(fromId).blocked || this.getNode(toId).blocked) {
      return false;
    }

    const weight = Number.isFinite(options.weight)
      ? options.weight
      : this.distanceBetween(fromId, toId);

    const edge = {
      from: fromId,
      to: toId,
      weight: Math.max(0, weight),
      metadata: options.metadata || {}
    };

    if (!this.edges.has(fromId)) {
      this.edges.set(fromId, []);
    }

    this.edges.get(fromId).push(edge);

    if (options.bidirectional !== false) {
      this.addEdge(toId, fromId, {
        weight,
        bidirectional: false,
        metadata: options.metadata
      });
    }

    return edge;
  }

  getNeighbors(id) {
    return this.edges.get(String(id)) || [];
  }

  distanceBetween(aId, bId) {
    const a = this.getNode(aId);
    const b = this.getNode(bId);

    if (!a || !b) {
      return Infinity;
    }

    return Math.hypot(
      b.x - a.x,
      b.y - a.y
    );
  }

  buildGrid(grid, options = {}) {
    if (!Array.isArray(grid) || !Array.isArray(grid[0])) {
      throw new Error("Grid must be a 2D array.");
    }

    const height = grid.length;
    const width = grid[0].length;

    this.nodes.clear();
    this.edges.clear();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = grid[y][x];

        let terrain = "normal";
        let blocked = false;
        let metadata = {};

        if (typeof cell === "string") {
          terrain = cell;
        } else if (cell && typeof cell === "object") {
          terrain = cell.terrain || "normal";
          blocked = Boolean(cell.blocked);
          metadata = cell.metadata || {};
        }

        this.addNode({
          id: `${x}:${y}`,
          x,
          y,
          terrain,
          blocked,
          metadata
        });
      }
    }

    const diagonal =
      options.allowDiagonal ??
      this.options.allowDiagonal;

    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];

    if (diagonal) {
      directions.push(
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1]
      );
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const currentId = `${x}:${y}`;
        const current = this.getNode(currentId);

        if (!current || current.blocked) {
          continue;
        }

        for (const [dx, dy] of directions) {
          const nx = x + dx;
          const ny = y + dy;

          if (
            nx < 0 ||
            ny < 0 ||
            nx >= width ||
            ny >= height
          ) {
            continue;
          }

          const neighbor = this.getNode(`${nx}:${ny}`);

          if (!neighbor || neighbor.blocked) {
            continue;
          }

          this.addEdge(
            currentId,
            neighbor.id,
            {
              weight: Math.hypot(dx, dy),
              bidirectional: false
            }
          );
        }
      }
    }

    return this;
  }

  clone() {
    const cloned = new Graph(this.options);

    for (const node of this.nodes.values()) {
      cloned.addNode({
        ...node,
        metadata: {
          ...node.metadata
        }
      });
    }

    for (const [id, edges] of this.edges.entries()) {
      cloned.edges.set(
        id,
        edges.map(edge => ({
          ...edge,
          metadata: {
            ...edge.metadata
          }
        }))
      );
    }

    return cloned;
  }

  toJSON() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()).flat()
    };
  }
}

module.exports = Graph;
