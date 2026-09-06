/**
 * scenarioLoader.js
 *
 * Loads and validates simulation scenarios.
 */

import fs from "fs/promises";
import path from "path";

export class ScenarioLoader {
    constructor(options = {}) {
        this.baseDirectory = options.baseDirectory || process.cwd();

        this.validators = options.validators || [];
    }

    async loadFromFile(filePath) {
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(this.baseDirectory, filePath);

        const content = await fs.readFile(absolutePath, "utf8");

        let scenario;

        try {
            scenario = JSON.parse(content);
        } catch (error) {
            throw new Error(
                `Invalid scenario JSON: ${error.message}`
            );
        }

        return this.load(scenario);
    }

    load(scenario) {
        const normalized = this.normalize(scenario);

        this.validate(normalized);

        return normalized;
    }

    normalize(scenario) {
        return {
            id: scenario.id || `scenario-${Date.now()}`,

            name: scenario.name || "Unnamed Scenario",

            description: scenario.description || "",

            version: scenario.version || "1.0.0",

            startTime: scenario.startTime || Date.now(),

            duration: scenario.duration ?? null,

            seed: scenario.seed ?? null,

            entities: Array.isArray(scenario.entities)
                ? scenario.entities
                : [],

            environment: scenario.environment || {},

            events: Array.isArray(scenario.events)
                ? scenario.events
                : [],

            metadata: scenario.metadata || {}
        };
    }

    validate(scenario) {
        if (!scenario.id) {
            throw new Error("Scenario must have an id");
        }

        if (!Array.isArray(scenario.entities)) {
            throw new Error("Scenario entities must be an array");
        }

        if (!scenario.environment) {
            throw new Error("Scenario environment is required");
        }

        for (const validator of this.validators) {
            const result = validator(scenario);

            if (result === false) {
                throw new Error("Scenario validation failed");
            }

            if (typeof result === "string") {
                throw new Error(result);
            }
        }

        return true;
    }

    validateEntity(entity) {
        if (!entity || typeof entity !== "object") {
            throw new Error("Invalid entity");
        }

        if (!entity.id) {
            throw new Error("Entity must have an id");
        }

        if (!entity.type) {
            throw new Error(
                `Entity ${entity.id} must have a type`
            );
        }

        return true;
    }
}
