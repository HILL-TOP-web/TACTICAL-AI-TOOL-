/**
 * worldState.js
 *
 * Stores the complete state of the simulated world.
 */

import { Entity } from "./entity.js";
import { Environment } from "./environment.js";

export class WorldState {
    constructor(options = {}) {
        this.id = options.id || `world-${Date.now()}`;

        this.entities = new Map();

        this.events = [];

        this.history = [];

        this.environment = new Environment(
            options.environment || {}
        );

        this.metadata = {};

        this.time = Date.now();
    }

    loadScenario(scenario) {
        this.reset();

        this.time = scenario.startTime || Date.now();

        this.metadata = {
            scenarioId: scenario.id,
            scenarioName: scenario.name,
            description: scenario.description,
            ...scenario.metadata
        };

        this.environment = new Environment(
            scenario.environment || {}
        );

        for (const entityData of scenario.entities || []) {
            const entity = new Entity(entityData);

            this.addEntity(entity);
        }

        for (const event of scenario.events || []) {
            this.queueEvent(event);
        }

        return this;
    }

    addEntity(entity) {
        if (!(entity instanceof Entity)) {
            entity = new Entity(entity);
        }

        if (this.entities.has(entity.id)) {
            throw new Error(
                `Entity already exists: ${entity.id}`
            );
        }

        this.entities.set(entity.id, entity);

        return entity;
    }

    removeEntity(id) {
        return this.entities.delete(id);
    }

    getEntity(id) {
        return this.entities.get(id) || null;
    }

    getEntities() {
        return Array.from(this.entities.values());
    }

    getEntitiesByType(type) {
        return this.getEntities().filter(
            entity => entity.type === type
        );
    }

    queueEvent(event) {
        this.events.push({
            id: event.id || `event-${Date.now()}-${Math.random()}`,
            type: event.type || "unknown",
            time: event.time ?? this.time,
            data: event.data || {},
            source: event.source || "simulation"
        });
    }

    consumeEvents() {
        const currentTime = this.time;

        const ready = [];
        const pending = [];

        for (const event of this.events) {
            if (event.time <= currentTime) {
                ready.push(event);
            } else {
                pending.push(event);
            }
        }

        this.events = pending;

        return ready;
    }

    applyEvent(event) {
        switch (event.type) {
            case "entity.create":
                if (event.data.entity) {
                    this.addEntity(
                        new Entity(event.data.entity)
                    );
                }
                break;

            case "entity.remove":
                if (event.data.entityId) {
                    this.removeEntity(
                        event.data.entityId
                    );
                }
                break;

            case "entity.update":
                this._updateEntity(event);
                break;

            case "environment.update":
                this.environment.merge(event.data);
                break;

            case "world.update":
                this.merge(event.data);
                break;

            default:
                break;
        }

        this.history.push({
            ...event,
            appliedAt: this.time
        });
    }

    _updateEntity(event) {
        const entity = this.getEntity(
            event.data.entityId
        );

        if (!entity) {
            return;
        }

        entity.merge(event.data.changes || {});
    }

    update(context) {
        this.time = context.time;

        this.history.push({
            type: "world.tick",
            time: this.time,
            tick: context.tick
        });

        // Keep history bounded.
        if (this.history.length > 10000) {
            this.history.splice(
                0,
                this.history.length - 10000
            );
        }
    }

    merge(data = {}) {
        Object.assign(this.metadata, data.metadata || {});
    }

    snapshot() {
        return {
            id: this.id,

            time: this.time,

            metadata: structuredClone(this.metadata),

            environment: this.environment.snapshot(),

            entities: this.getEntities().map(
                entity => entity.snapshot()
            ),

            pendingEvents: structuredClone(this.events)
        };
    }

    reset() {
        this.entities.clear();

        this.events = [];

        this.history = [];

        this.metadata = {};

        this.environment = new Environment();

        this.time = Date.now();
    }
    }
