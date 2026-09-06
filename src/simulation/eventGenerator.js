/**
 * eventGenerator.js
 *
 * Generates simulated world events.
 *
 * This module intentionally uses abstract simulation events rather
 * than real-world operational instructions.
 */

export class EventGenerator {
    constructor(options = {}) {
        this.random = options.random;

        this.rules = [];

        this.registerDefaultRules();
    }

    registerRule(rule) {
        if (
            !rule ||
            typeof rule.condition !== "function" ||
            typeof rule.generate !== "function"
        ) {
            throw new Error(
                "Invalid event generation rule"
            );
        }

        this.rules.push(rule);

        return this;
    }

    registerDefaultRules() {
        this.registerRule({
            name: "environment-change",

            probability: 0.02,

            condition: () => true,

            generate: context => ({
                type: "environment.update",

                time: context.currentTime,

                source: "event-generator",

                data: {
                    weather: {
                        cloudCover:
                            this.random.float(0, 100)
                    }
                }
            })
        });

        this.registerRule({
            name: "entity-state-change",

            probability: 0.01,

            condition: context =>
                context.world.getEntities().length > 0,

            generate: context => {
                const entities =
                    context.world.getEntities();

                const entity =
                    this.random.choice(entities);

                return {
                    type: "entity.update",

                    time: context.currentTime,

                    source: "event-generator",

                    data: {
                        entityId: entity.id,

                        changes: {
                            state: this.random.choice([
                                "idle",
                                "moving",
                                "paused"
                            ])
                        }
                    }
                };
            }
        });
    }

    generate(context) {
        const events = [];

        for (const rule of this.rules) {
            if (!rule.condition(context)) {
                continue;
            }

            const probability =
                rule.probability ?? 0;

            if (
                this.random &&
                !this.random.chance(probability)
            ) {
                continue;
            }

            try {
                const event = rule.generate(context);

                if (event) {
                    events.push(event);
                }
            } catch (error) {
                console.error(
                    `Event generation failed [${rule.name}]:`,
                    error
                );
            }
        }

        return events;
    }

    generateScheduledEvent(
        type,
        time,
        data = {},
        source = "scenario"
    ) {
        return {
            id: `event-${Date.now()}-${Math.random()}`,

            type,

            time,

            source,

            data
        };
    }
        }
