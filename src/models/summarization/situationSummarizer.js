/**
 * Situation Summarizer
 * --------------------
 * Produces a structured summary from simulation state.
 */

class SituationSummarizer {
  summarize(state = {}) {
    const summary = {
      overview: "No situation data available.",
      keyFactors: [],
      warnings: [],
      confidence: 0
    };

    if (!state || Object.keys(state).length === 0) {
      return summary;
    }

    const factors = [];

    if (state.terrain) {
      factors.push(`Terrain: ${state.terrain}`);
    }

    if (state.weather) {
      factors.push(`Weather: ${state.weather}`);
    }

    if (state.resources !== undefined) {
      factors.push(`Resources: ${state.resources}`);
    }

    if (state.personnel !== undefined) {
      factors.push(`Personnel: ${state.personnel}`);
    }

    if (state.status) {
      factors.push(`Status: ${state.status}`);
    }

    if (state.hazards > 0) {
      summary.warnings.push(
        `${state.hazards} hazard(s) detected in the simulation state.`
      );
    }

    summary.keyFactors = factors;

    summary.overview =
      factors.length > 0
        ? factors.join(". ") + "."
        : "Situation data is incomplete.";

    summary.confidence =
      factors.length >= 3 ? 0.85 : 0.60;

    return summary;
  }
}

module.exports = SituationSummarizer;
