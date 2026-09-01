/**
 * obstacles.js
 *
 * Generic obstacle system
 * for fictional maps.
 */

class Obstacles {
  constructor() {
    this.obstacles = [];
  }

  add(obstacle) {
    this.obstacles.push({
      id:
        obstacle.id ||
        Date.now(),

      x: obstacle.x || 0,

      y: obstacle.y || 0,

      type:
        obstacle.type ||
        "generic",

      passable:
        obstacle.passable ||
        false
    });
  }

  remove(id) {
    this.obstacles =
      this.obstacles.filter(
        (o) => o.id !== id
      );
  }

  getAll() {
    return [
      ...this.obstacles
    ];
  }

  getAt(x, y) {
    return this.obstacles.find(
      (o) =>
        o.x === x &&
        o.y === y
    );
  }

  isBlocked(x, y) {
    const obj =
      this.getAt(x, y);

    return obj
      ? !obj.passable
      : false;
  }

  clear() {
    this.obstacles = [];
  }
}

module.exports = Obstacles;
