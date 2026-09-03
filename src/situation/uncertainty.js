export class Uncertainty {
  constructor(options = {}) {
    this.options = {
      minimumConfidence: options.minimumConfidence ?? 0,
      maximumConfidence: options.maximumConfidence ?? 1,
      ...options
    };
  }

  calculate({
    estimate = {},
    entities = [],
    events = [],
    timestamp = Date.now()
  }) {
    const factors = [];

    const estimateConfidence =
      this.clamp(
        estimate.confidence ?? 0.5
      );

    factors.push({
      name: "state_estimate",
      confidence: estimateConfidence
    });

    if (entities.length > 0) {
      const entityConfidence =
        entities.reduce(
          (sum, entity) =>
            sum +
            this.clamp(
              entity.confidence ?? 0.5
            ),
          0
        ) / entities.length;

      factors.push({
        name: "entity_tracking",
        confidence: entityConfidence
      });
    }

    if (events.length > 0) {
      factors.push({
        name: "event_detection",
        confidence: 0.75
      });
    }

    const confidence =
      factors.reduce(
        (sum, factor) =>
          sum + factor.confidence,
        0
      ) / factors.length;

    return {
      timestamp,
      confidence: this.clamp(confidence),
      uncertainty: 1 - this.clamp(confidence),
      level: this.getLevel(confidence),
      factors
    };
  }

  getLevel(confidence) {
    if (confidence >= 0.8) {
      return "low";
    }

    if (confidence >= 0.6) {
      return "moderate";
    }

    if (confidence >= 0.4) {
      return "high";
    }

    return "very_high";
  }

  clamp(value) {
    return Math.min(
      this.options.maximumConfidence,
      Math.max(
        this.options.minimumConfidence,
        Number(value) || 0
      )
    );
  }
}

export default Uncertainty;
