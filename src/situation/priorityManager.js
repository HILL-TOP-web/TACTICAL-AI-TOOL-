export class PriorityManager {
  constructor(options = {}) {
    this.options = {
      maxPriorities: options.maxPriorities ?? 10,
      ...options
    };
  }

  rank({
    entities = [],
    events = [],
    estimate = {},
    uncertainty = {}
  }) {
    const priorities = [];

    for (const event of events) {
      priorities.push({
        type: "event",
        id: event.id,
        score: this.eventScore(event),
        reason: `Recent ${event.type} event`,
        data: event
      });
    }

    for (const entity of entities) {
      priorities.push({
        type: "entity",
        id: entity.id,
        score: this.entityScore(entity),
        reason: this.entityReason(entity),
        data: {
          id: entity.id,
          type: entity.type,
          status: entity.status,
          confidence: entity.confidence
        }
      });
    }

    if (
      uncertainty &&
      uncertainty.level === "very_high"
    ) {
      priorities.push({
        type: "uncertainty",
        id: "system_uncertainty",
        score: 90,
        reason:
          "Situation estimate has very high uncertainty"
      });
    }

    return priorities
      .sort((a, b) => b.score - a.score)
      .slice(0, this.options.maxPriorities);
  }

  eventScore(event) {
    const scores = {
      critical: 100,
      high: 80,
      warning: 65,
      medium: 50,
      low: 30,
      info: 20
    };

    return scores[event.severity] ?? 20;
  }

  entityScore(entity) {
    let score = 20;

    if (entity.status === "active") {
      score += 20;
    }

    if (entity.motion?.state === "moving") {
      score += 15;
    }

    if (
      typeof entity.confidence === "number"
    ) {
      score += entity.confidence * 20;
    }

    return Math.min(100, Math.round(score));
  }

  entityReason(entity) {
    if (entity.status === "stale") {
      return "Entity information may be outdated";
    }

    if (entity.motion?.state === "moving") {
      return "Entity is currently moving";
    }

    return "Tracked entity requires monitoring";
  }
}

export default PriorityManager;
