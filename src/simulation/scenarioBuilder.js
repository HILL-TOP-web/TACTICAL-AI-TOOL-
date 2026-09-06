/**
 * scenarioBuilder.js
 *
 * Fluent builder for creating simulation scenarios.
 */

export class ScenarioBuilder {
    constructor(options = {}) {
        this.scenario = {
            id: options.id ||
                `scenario-${Date.now()}`,

            name: options.name ||
                "Unnamed Scenario",

            description:
                options.description || "",

            version:
                options.version || "1.0.0",

            startTime:
                options.startTime || Date.now(),

            duration:
                options.duration ?? null,

            seed:
                options.seed ?? null,

            entities: [],

            environment: {},

            events: [],

            metadata: {}
        };
    }

    setId(id) {
        this.scenario.id = id;

        return this;
    }

    setName(name) {
        this.scenario.name = name;

        return this;
    }

    setDescription(description) {
        this.scenario.description =
            description;

        return this;
    }

    setStartTime(time) {
        this.scenario.startTime = time;

        return this;
    }

    setDuration(duration) {
        this.scenario.duration =
            duration;

        return this;
    }

    setSeed(seed) {
        this.scenario.seed = seed;

        return this;
    }

    setEnvironment(environment) {
        this.scenario.environment = {
            ...environment
        };

        return this;
    }

    updateEnvironment(changes) {
        this.scenario.environment = {
            ...this.scenario.environment,
            ...changes
        };

        return this;
    }

    addEntity(entity) {
        if (!entity.id) {
            entity.id =
                `entity-${this.scenario.entities.length + 1}`;
        }

        this.scenario.entities.push({
            ...entity
        });

        return this;
    }

    addEntities(entities) {
        for (const entity of entities) {
            this.addEntity(entity);
        }

        return this;
    }

    removeEntity(id) {
        this.scenario.entities =
            this.scenario.entities.filter(
                entity => entity.id !== id
            );

        return this;
    }

    addEvent(event) {
        this.scenario.events.push({
            ...event,
            id: event.id ||
                `event-${this.scenario.events.length + 1}`
        });

        return this;
    }

    addMetadata(key, value) {
        this.scenario.metadata[key] =
            value;

        return this;
    }

    setMetadata(metadata) {
        this.scenario.metadata = {
            ...metadata
        };

        return this;
    }

    build() {
        return structuredClone(
            this.scenario
        );
    }

    toJSON() {
        return JSON.stringify(
            this.build(),
            null,
            2
        );
    }
}
