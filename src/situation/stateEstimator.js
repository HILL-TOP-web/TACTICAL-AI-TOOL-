export class StateEstimator {
  constructor(options = {}) {
    this.options = {
      smoothingFactor: options.smoothingFactor ?? 0.35,
      ...options
    };

    this.previous = null;
  }

  estimate({ input = {}, entities = [], events = [] }) {
    const timestamp = input.timestamp ?? Date.now();

    const environment = this.estimateEnvironment(input);
    const activity = this.estimateActivity(entities, events);
    const entityCount = entities.length;

    const raw = {
      timestamp,
      environment,
      activity,
      entityCount,
      eventCount: events.length,
      confidence: this.calculateConfidence({
        input,
        entities,
        events
      })
    };

    const result = this.smooth(raw);

    this.previous = result;

    return result;
  }

  estimateEnvironment(input) {
    return {
      location: input.location ?? null,
      terrain: input.terrain ?? "unknown",
      weather: input.weather ?? "unknown",
      visibility: input.visibility ?? "unknown",
      conditions: input.conditions ?? []
    };
  }

  estimateActivity(entities, events) {
    const activeEntities = entities.filter(
      entity => entity.status !== "stale"
    );

    const moving = activeEntities.filter(
      entity => entity.motion?.state === "moving"
    );

    const stationary = activeEntities.filter(
      entity => entity.motion?.state === "stationary"
    );

    return {
      activeEntities: activeEntities.length,
      movingEntities: moving.length,
      stationaryEntities: stationary.length,
      recentEvents: events.length
    };
  }

  calculateConfidence({ input, entities, events }) {
    let score = 0.5;

    if (input.timestamp) score += 0.05;
    if (input.location) score += 0.05;
    if (input.terrain) score += 0.05;
    if (input.weather) score += 0.05;

    if (entities.length > 0) score += 0.1;
    if (events.length > 0) score += 0.05;

    return Math.min(1, Math.max(0, score));
  }

  smooth(current) {
    if (!this.previous) {
      return current;
    }

    const alpha = this.options.smoothingFactor;

    return {
      ...current,
      confidence:
        this.previous.confidence * (1 - alpha) +
        current.confidence * alpha
    };
  }

  reset() {
    this.previous = null;
  }
}

export default StateEstimator;
