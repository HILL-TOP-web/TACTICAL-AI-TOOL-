/**
 * Situation Classifier
 * --------------------
 * Classifies a fictional training scenario into a broad
 * situation category.
 *
 * It is intended for simulation/training use.
 */

class SituationClassifier {
  classify(data = {}) {
    const {
      personnel = 0,
      resources = 0,
      hazards = 0,
      weatherSeverity = 0,
      routeDifficulty = 0
    } = data;

    let status = "normal";
    let confidence = 0.70;

    const riskScore =
      hazards * 0.35 +
      weatherSeverity * 0.20 +
      routeDifficulty * 0.25 +
      (resources < 30 ? 0.20 : 0);

    if (riskScore >= 0.75) {
      status = "critical";
      confidence = 0.92;
    } else if (riskScore >= 0.50) {
      status = "high_risk";
      confidence = 0.87;
    } else if (riskScore >= 0.25) {
      status = "elevated";
      confidence = 0.82;
    }

    if (personnel <= 0) {
      status = "no_personnel_data";
      confidence = 0.95;
    }

    return {
      status,
      confidence,
      riskScore: Number(riskScore.toFixed(2)),
      inputs: {
        personnel,
        resources,
        hazards,
        weatherSeverity,
        routeDifficulty
      }
    };
  }
}

module.exports = SituationClassifier;
