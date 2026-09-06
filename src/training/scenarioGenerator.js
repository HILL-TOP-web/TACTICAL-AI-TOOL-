/**
 * scenarioGenerator.js
 *
 * Generates fictional training scenarios.
 *
 * Scenarios are abstract and intended for
 * simulation/testing purposes.
 */

export class ScenarioGenerator {
    constructor(options = {}) {
        this.random =
            options.random || Math.random;

        this.templates = new Map();

        this.registerDefaultTemplates();
    }

    registerTemplate(
        name,
        template
    ) {
        if (!name || !template) {
            throw new Error(
                "Template name and template are required"
            );
        }

        this.templates.set(
            name,
            template
        );

        return this;
    }

    registerDefaultTemplates() {
        this.registerTemplate(
            "navigation",
            {
                type: "navigation",

                objectives: [
                    {
                        id: "nav-1",
                        name:
                            "Reach the designated waypoint",
                        type: "completion",
                        weight: 1
                    },

                    {
                        id: "nav-2",
                        name:
                            "Maintain route awareness",
                        type: "performance",
                        weight: 1
                    }
                ]
            }
        );

        this.registerTemplate(
            "search",
            {
                type: "search",

                objectives: [
                    {
                        id: "search-1",
                        name:
                            "Complete the search task",
                        type: "completion",
                        weight: 1
                    },

                    {
                        id: "search-2",
                        name:
                            "Maintain situational awareness",
                        type: "performance",
                        weight: 1
                    }
                ]
            }
        );

        this.registerTemplate(
            "decision",
            {
                type: "decision",

                objectives: [
                    {
                        id: "decision-1",
                        name:
                            "Identify available options",
                        type: "analysis",
                        weight: 1
                    },

                    {
                        id: "decision-2",
                        name:
                            "Select a justified option",
                        type: "decision-quality",
                        weight: 1
                    }
                ]
            }
        );
    }

    generate(options = {}) {
        const type =
            options.type ||
            this.randomChoice(
                Array.from(
                    this.templates.keys()
                )
            );

        const template =
            this.templates.get(type);

        if (!template) {
            throw new Error(
                `Unknown scenario template: ${type}`
            );
        }

        const id =
            options.id ||
            `scenario-${Date.now()}`;

        return {
            id,

            name:
                options.name ||
                `${type} training exercise`,

            type,

            description:
                options.description ||
                `Fictional ${type} training scenario.`,

            difficulty:
                options.difficulty ||
                "moderate",

            duration:
                options.duration ||
                30 * 60 * 1000,

            environment:
                structuredClone(
                    options.environment || {}
                ),

            objectives:
                structuredClone(
                    options.objectives ||
                    template.objectives
                ),

            constraints:
                structuredClone(
                    options.constraints || []
                ),

            events:
                structuredClone(
                    options.events || []
                ),

            metadata: {
                generatedAt:
                    Date.now(),

                ...options.metadata
            }
        };
    }

    generateBatch(
        count,
        options = {}
    ) {
        if (count <= 0) {
            return [];
        }

        return Array.from(
            { length: count },
            (_, index) =>
                this.generate({
                    ...options,
                    id:
                        options.idPrefix
                            ? `${options.idPrefix}-${index + 1}`
                            : undefined
                })
        );
    }

    randomChoice(array) {
        if (!array.length) {
            return null;
        }

        return array[
            Math.floor(
                this.random() *
                array.length
            )
        ];
    }
              }
