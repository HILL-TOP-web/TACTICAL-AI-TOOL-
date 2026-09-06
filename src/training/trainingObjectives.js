/**
 * trainingObjectives.js
 *
 * Manages training objectives and evaluates
 * whether participants have met them.
 */

export class TrainingObjectives {
    constructor(objectives = []) {
        this.objectives = new Map();

        this.load(objectives);
    }

    load(objectives) {
        this.objectives.clear();

        for (const objective of objectives) {
            this.add(objective);
        }

        return this;
    }

    add(objective) {
        if (!objective?.id) {
            throw new Error(
                "Objective requires an id"
            );
        }

        this.objectives.set(
            objective.id,
            {
                id: objective.id,

                name:
                    objective.name ||
                    objective.id,

                description:
                    objective.description ||
                    "",

                type:
                    objective.type ||
                    "completion",

                weight:
                    objective.weight ??
                    1,

                target:
                    objective.target ??
                    null,

                threshold:
                    objective.threshold ??
                    1,

                mandatory:
                    objective.mandatory ??
                    false,

                metadata:
                    objective.metadata || {}
            }
        );

        return this;
    }

    get(id) {
        return (
            this.objectives.get(id) ||
            null
        );
    }

    getAll() {
        return Array.from(
            this.objectives.values()
        ).map(
            objective =>
                structuredClone(objective)
        );
    }

    evaluate(
        objectiveId,
        actualValue
    ) {
        const objective =
            this.get(objectiveId);

        if (!objective) {
            throw new Error(
                `Unknown objective: ${objectiveId}`
            );
        }

        let achieved;

        if (
            typeof actualValue ===
            "boolean"
        ) {
            achieved =
                actualValue;
        } else if (
            typeof actualValue ===
            "number"
        ) {
            achieved =
                actualValue >=
                objective.threshold;
        } else {
            achieved =
                actualValue !==
                null &&
                actualValue !==
                undefined;
        }

        return {
            objectiveId,

            achieved,

            value:
                actualValue,

            threshold:
                objective.threshold,

            weight:
                objective.weight,

            mandatory:
                objective.mandatory
        };
    }

    evaluateAll(results = []) {
        return results.map(result =>
            this.evaluate(
                result.objectiveId,
                result.value
            )
        );
    }

    completionRate(results = []) {
        if (!results.length) {
            return 0;
        }

        const completed =
            results.filter(
                result =>
                    result.achieved
            ).length;

        return completed /
            results.length;
    }
              }
