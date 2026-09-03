export class SummaryGenerator {
  constructor(options = {}) {
    this.options = options;
  }

  generate(state = {}) {
    const entities = state.entities ?? [];
    const events = state.events ?? [];
    const priorities = state.priorities ?? [];
    const estimate = state.estimate ?? {};
    const uncertainty = state.uncertainty ?? {};

    const activeEntities = entities.filter(
      entity => entity.status === "active"
    );

    const movingEntities = entities.filter(
      entity =>
        entity.motion?.state === "moving"
    );

    const staleEntities = entities.filter(
      entity => entity.status === "stale"
    );

    return {
      generatedAt: Date.now(),

      status: state.status ?? "unknown",

      cycle: state.cycle ?? 0,

      situation: {
        entityCount: entities.length,
        activeEntities: activeEntities.length,
        movingEntities: movingEntities.length,
        staleEntities: staleEntities.length,
        recentEvents: events.length
      },

      environment: estimate.environment ?? {
        terrain: "unknown",
        weather: "unknown",
        visibility: "unknown"
      },

      confidence: {
        overall: uncertainty.confidence ?? null,
        uncertainty: uncertainty.uncertainty ?? null,
        level: uncertainty.level ?? "unknown"
      },

      priorities: priorities.slice(0, 5),

      narrative: this.buildNarrative({
        entities,
        events,
        priorities,
        estimate,
        uncertainty
      })
    };
  }

  buildNarrative({
    entities,
    events,
    priorities,
    estimate,
    uncertainty
  }) {
    const parts = [];

    parts.push(
      `Tracking ${entities.length} entities.`
    );

    if (estimate.environment?.terrain) {
      parts.push(
        `Terrain is classified as ${estimate.environment.terrain}.`
      );
    }

    if (estimate.environment?.visibility) {
      parts.push(
        `Visibility is ${estimate.environment.visibility}.`
      );
    }

    const moving = entities.filter(
      entity =>
        entity.motion?.state === "moving"
    ).length;

    if (moving > 0) {
      parts.push(
        `${moving} tracked entities are moving.`
      );
    }

    if (events.length > 0) {
      parts.push(
        `${events.length} recent event(s) were detected.`
      );
    }

    if (uncertainty.level) {
      parts.push(
        `Overall uncertainty is ${uncertainty.level}.`
      );
    }

    if (priorities.length > 0) {
      parts.push(
        `${priorities.length} items are currently prioritized for monitoring.`
      );
    }

    return parts.join(" ");
  }
}

export default SummaryGenerator;
