/**
 * landCover.js
 *
 * Surface classification.
 */

class LandCover {
  constructor() {
    this.types = {
      grass: {
        movementCost: 1
      },

      forest: {
        movementCost: 2
      },

      water: {
        movementCost: 999
      },

      urban: {
        movementCost: 1.5
      },

      sand: {
        movementCost: 2.5
      },

      rock: {
        movementCost: 3
      }
    };
  }

  get(type) {
    return (
      this.types[type] ||
      {
        movementCost: 1
      }
    );
  }

  isPassable(type) {
    return (
      this.get(type)
        .movementCost < 999
    );
  }

  movementCost(type) {
    return this.get(type)
      .movementCost;
  }

  list() {
    return Object.keys(
      this.types
    );
  }
}

module.exports = LandCover;
