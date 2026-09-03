export class EntityTracker {
  constructor(options = {}) {
    this.options = {
      staleAfterMs: options.staleAfterMs ?? 30000,
      maxEntities: options.maxEntities ?? 1000,
      ...options
    };

    this.entities = new Map();
  }

  update(observations = [], timestamp = Date.now()) {
    if (!Array.isArray(observations)) {
      return this.getAll();
    }

    for (const observation of observations) {
      this.updateEntity(observation, timestamp);
    }

    this.markStale(timestamp);

    return this.getAll();
  }

  updateEntity(observation, timestamp) {
    if (!observation || !observation.id) {
      return null;
    }

    const id = String(observation.id);
    const previous = this.entities.get(id);

    const position = observation.position ?? previous?.position ?? null;

    const motion = this.calculateMotion(
      previous,
      position,
      timestamp
    );

    const entity = {
      id,

      type:
        observation.type ??
        previous?.type ??
        "unknown",

      label:
        observation.label ??
        previous?.label ??
        id,

      position,

      motion,

      status: "active",

      confidence:
        observation.confidence ??
        previous?.confidence ??
        0.5,

      attributes: {
        ...(previous?.attributes ?? {}),
        ...(observation.attributes ?? {})
      },

      firstSeen:
        previous?.firstSeen ??
        timestamp,

      lastSeen: timestamp,

      observationCount:
        (previous?.observationCount ?? 0) + 1
    };

    this.entities.set(id, entity);

    this.enforceLimit();

    return entity;
  }

  calculateMotion(previous, currentPosition, timestamp) {
    if (!previous || !previous.position || !currentPosition) {
      return {
        state: "unknown",
        speed: null,
        direction: null
      };
    }

    const dt = (timestamp - previous.lastSeen) / 1000;

    if (dt <= 0) {
      return previous.motion ?? {
        state: "unknown",
        speed: null,
        direction: null
      };
    }

    const distance = this.distance(
      previous.position,
      currentPosition
    );

    const speed = distance / dt;

    let state = "stationary";

    if (speed > 0.5) {
      state = "moving";
    }

    return {
      state,
      speed,
      direction: this.direction(
        previous.position,
        currentPosition
      )
    };
  }

  distance(a, b) {
    if (
      typeof a.x !== "number" ||
      typeof a.y !== "number" ||
      typeof b.x !== "number" ||
      typeof b.y !== "number"
    ) {
      return 0;
    }

    return Math.sqrt(
      Math.pow(b.x - a.x, 2) +
      Math.pow(b.y - a.y, 2)
    );
  }

  direction(a, b) {
    if (
      typeof a.x !== "number" ||
      typeof a.y !== "number" ||
      typeof b.x !== "number" ||
      typeof b.y !== "number"
    ) {
      return null;
    }

    const angle =
      Math.atan2(
        b.y - a.y,
        b.x - a.x
      ) *
      (180 / Math.PI);

    return (angle + 360) % 360;
  }

  markStale(timestamp) {
    for (const entity of this.entities.values()) {
      if (
        timestamp - entity.lastSeen >
        this.options.staleAfterMs
      ) {
        entity.status = "stale";
      }
    }
  }

  get(id) {
    const entity = this.entities.get(String(id));

    return entity
      ? structuredClone(entity)
      : null;
  }

  getAll() {
    return Array.from(this.entities.values())
      .map(entity => structuredClone(entity));
  }

  remove(id) {
    return this.entities.delete(String(id));
  }

  clear() {
    this.entities.clear();
  }

  enforceLimit() {
    if (this.entities.size <= this.options.maxEntities) {
      return;
    }

    const sorted = [...this.entities.values()]
      .sort((a, b) => a.lastSeen - b.lastSeen);

    while (
      this.entities.size >
      this.options.maxEntities
    ) {
      const oldest = sorted.shift();

      if (oldest) {
        this.entities.delete(oldest.id);
      }
    }
  }
}

export default EntityTracker;
