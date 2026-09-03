import { StateEstimator } from "./stateEstimator.js";
import { EntityTracker } from "./entityTracker.js";
import { EventDetection } from "./eventDetection.js";
import { Timeline } from "./timeline.js";
import { Uncertainty } from "./uncertainty.js";
import { PriorityManager } from "./priorityManager.js";
import { SummaryGenerator } from "./summaryGenerator.js";

export class SituationEngine {
  constructor(options = {}) {
    this.options = {
      maxHistory: options.maxHistory ?? 500,
      staleAfterMs: options.staleAfterMs ?? 30000,
      ...options
    };

    this.stateEstimator = new StateEstimator(this.options);
    this.entityTracker = new EntityTracker(this.options);
    this.eventDetection = new EventDetection(this.options);
    this.timeline = new Timeline(this.options);
    this.uncertainty = new Uncertainty(this.options);
    this.priorityManager = new PriorityManager(this.options);
    this.summaryGenerator = new SummaryGenerator(this.options);

    this.state = {
      status: "initialized",
      startedAt: Date.now(),
      updatedAt: null,
      cycle: 0,
      entities: [],
      events: [],
      priorities: [],
      estimate: null,
      uncertainty: null
    };
  }

  ingest(input = {}) {
    const timestamp = input.timestamp ?? Date.now();

    const normalized = {
      ...input,
      timestamp
    };

    this.timeline.add({
      type: "observation",
      timestamp,
      data: normalized
    });

    const trackedEntities =
      this.entityTracker.update(normalized.entities ?? [], timestamp);

    const events =
      this.eventDetection.detect(normalized, trackedEntities);

    for (const event of events) {
      this.timeline.add({
        type: "event",
        timestamp: event.timestamp ?? timestamp,
        data: event
      });
    }

    const estimate = this.stateEstimator.estimate({
      input: normalized,
      entities: trackedEntities,
      events
    });

    const uncertainty = this.uncertainty.calculate({
      estimate,
      entities: trackedEntities,
      events,
      timestamp
    });

    const priorities = this.priorityManager.rank({
      entities: trackedEntities,
      events,
      estimate,
      uncertainty
    });

    this.state = {
      ...this.state,
      status: "running",
      updatedAt: timestamp,
      cycle: this.state.cycle + 1,
      entities: trackedEntities,
      events,
      priorities,
      estimate,
      uncertainty
    };

    this.timeline.trim(this.options.maxHistory);

    return this.getState();
  }

  getState() {
    return structuredClone(this.state);
  }

  getSummary() {
    return this.summaryGenerator.generate(this.state);
  }

  getTimeline(options = {}) {
    return this.timeline.get(options);
  }

  getEntity(id) {
    return this.entityTracker.get(id);
  }

  reset() {
    this.entityTracker.clear();
    this.timeline.clear();
    this.eventDetection.clear();

    this.state = {
      status: "initialized",
      startedAt: Date.now(),
      updatedAt: null,
      cycle: 0,
      entities: [],
      events: [],
      priorities: [],
      estimate: null,
      uncertainty: null
    };

    return this.getState();
  }
}

export default SituationEngine;
