export class EventDetection {
  constructor(options = {}) {
    this.options = {
      movementThreshold: options.movementThreshold ?? 0.5,
      ...options
    };

    this.previousEntities = new Map();
    this.events = [];
  }

  detect(input = {}, entities = []) {
    const events = [];

    for (const entity of entities) {
      const previous = this.previousEntities.get(entity.id);

      if (!previous) {
        events.push(
          this.createEvent(
            "entity_detected",
            entity
          )
        );
      } else {
        if (
          previous.motion?.state !== "moving" &&
          entity.motion?.state === "moving"
        ) {
          events.push(
            this.createEvent(
              "movement_started",
              entity
            )
          );
        }

        if (
          previous.motion?.state === "moving" &&
          entity.motion?.state === "stationary"
        ) {
          events.push(
            this.createEvent(
              "movement_stopped",
              entity
            )
          );
        }

        if (
          previous.status !== "stale" &&
          entity.status === "stale"
        ) {
          events.push(
            this.createEvent(
              "entity_stale",
              entity
            )
          );
        }
      }

      this.previousEntities.set(
        entity.id,
        structuredClone(entity)
      );
    }

    if (Array.isArray(input.events)) {
      for (const event of input.events) {
        events.push({
          id: this.generateId(),
          type: event.type ?? "external_event",
          timestamp: input.timestamp ?? Date.now(),
          source: event.source ?? "input",
          severity: event.severity ?? "low",
          data: event.data ?? event
        });
      }
    }

    this.events.push(...events);

    return events;
  }

  createEvent(type, entity) {
    return {
      id: this.generateId(),
      type,
      timestamp: Date.now(),
      source: "entity_tracker",
      entityId: entity.id,
      severity: this.severityFor(type),
      data: {
        label: entity.label,
        status: entity.status,
        motion: entity.motion
      }
    };
  }

  severityFor(type) {
    const severityMap = {
      entity_detected: "info",
      movement_started: "low",
      movement_stopped: "info",
      entity_stale: "warning"
    };

    return severityMap[type] ?? "info";
  }

  generateId() {
    return `evt_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  getRecent(limit = 20) {
    return this.events
      .slice(-limit)
      .map(event => structuredClone(event));
  }

  clear() {
    this.previousEntities.clear();
    this.events = [];
  }
}

export default EventDetection;
