/**
 * elevation.js
 *
 * Elevation calculations
 * for fictional terrain.
 */

class Elevation {
  getHeight(cell) {
    return Number(
      cell?.elevation || 0
    );
  }

  difference(cellA, cellB) {
    return Math.abs(
      this.getHeight(cellA) -
      this.getHeight(cellB)
    );
  }

  slope(cellA, cellB) {
    const diff = this.difference(
      cellA,
      cellB
    );

    return diff / 10;
  }

  classify(height) {
    if (height < 20) {
      return "lowland";
    }

    if (height < 100) {
      return "hill";
    }

    if (height < 300) {
      return "highland";
    }

    return "mountain";
  }

  average(grid) {
    let total = 0;
    let count = 0;

    for (const row of grid) {
      for (const cell of row) {
        total +=
          Number(
            cell.elevation || 0
          );

        count++;
      }
    }

    return count
      ? total / count
      : 0;
  }
}

module.exports = Elevation;
