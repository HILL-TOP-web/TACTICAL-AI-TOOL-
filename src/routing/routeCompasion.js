/**
 * routeComparison.js
 *
 * Compares multiple calculated routes.
 */

class RouteComparison {
  constructor(options = {}) {
    this.options = {
      scoreWeight: options.scoreWeight ?? 1,
      distanceWeight:
        options.distanceWeight ?? 0,
      ...options
    };
  }

  compare(routes) {
    if (!Array.isArray(routes)) {
      throw new Error(
        "Routes must be an array."
      );
    }

    const validRoutes =
      routes.filter(
        route => route && route.found
      );

    if (validRoutes.length === 0) {
      return {
        best: null,
        ranking: []
      };
    }

    const ranking =
      validRoutes
        .map((route, index) => ({
          route,
          originalIndex: index,
          comparisonScore:
            this.calculateComparisonScore(
              route
            )
        }))
        .sort(
          (a, b) =>
            a.comparisonScore -
            b.comparisonScore
        );

    return {
      best: ranking[0].route,
      ranking
    };
  }

  calculateComparisonScore(route) {
    const score =
      route.score?.total ??
      route.cost ??
      Infinity;

    const distance =
      route.distance ??
      Infinity;

    return (
      score *
        this.options.scoreWeight +
      distance *
        this.options.distanceWeight
    );
  }

  best(routes) {
    return this.compare(routes).best;
  }

  compareTwo(routeA, routeB) {
    if (!routeA?.found) {
      return {
        winner: "B",
        reason: "Route A is unavailable."
      };
    }

    if (!routeB?.found) {
      return {
        winner: "A",
        reason: "Route B is unavailable."
      };
    }

    const scoreA =
      this.calculateComparisonScore(
        routeA
      );

    const scoreB =
      this.calculateComparisonScore(
        routeB
      );

    if (scoreA < scoreB) {
      return {
        winner: "A",
        scoreA,
        scoreB,
        difference: scoreB - scoreA
      };
    }

    if (scoreB < scoreA) {
      return {
        winner: "B",
        scoreA,
        scoreB,
        difference: scoreA - scoreB
      };
    }

    return {
      winner: "tie",
      scoreA,
      scoreB,
      difference: 0
    };
  }
}

module.exports = RouteComparison;
