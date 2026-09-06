/**
 * optionGenerator.js
 *
 * Generates abstract candidate options from a decision context.
 */

export class OptionGenerator {
    constructor(options = {}) {
        this.maxOptions =
            options.maxOptions ?? 10;

        this.generators = [];

        this.registerDefaultGenerators();
    }

    registerGenerator(generator) {
        if (typeof generator !== "function") {
            throw new Error(
                "Generator must be a function"
            );
        }

        this.generators.push(generator);

        return this;
    }

    registerDefaultGenerators() {
        this.registerGenerator(context => {
            return {
                id: "option-maintain",
                name: "Maintain Current State",
                description:
                    "Continue with the current approach while monitoring changes.",
                type: "conservative",
                assumptions: [],
                constraints: []
            };
        });

        this.registerGenerator(context => {
            return {
                id: "option-adjust",
                name: "Adjust Current Approach",
                description:
                    "Make a limited adjustment based on available information.",
                type: "adaptive",
                assumptions: [],
                constraints: []
            };
        });

        this.registerGenerator(context => {
            return {
                id: "option-defer",
                name: "Defer Pending Information",
                description:
                    "Delay a commitment while additional information is gathered.",
                type: "information-gathering",
                assumptions: [],
                constraints: []
            };
        });
    }

    generate(context = {}) {
        const results = [];

        for (const generator of this.generators) {
            try {
                const result = generator(context);

                if (!result) {
                    continue;
                }

                if (Array.isArray(result)) {
                    results.push(...result);
                } else {
                    results.push(result);
                }
            } catch (error) {
                console.error(
                    "Option generation error:",
                    error
                );
            }
        }

        const unique = [];
        const ids = new Set();

        for (const option of results) {
            if (!option.id) {
                continue;
            }

            if (ids.has(option.id)) {
                continue;
            }

            ids.add(option.id);

            unique.push({
                ...option,
                score: 0
            });
        }

        return unique.slice(0, this.maxOptions);
    }

    addCustomOption(option) {
        if (!option?.id) {
            throw new Error(
                "Custom option requires an id"
            );
        }

        return {
            ...option,
            score: option.score ?? 0
        };
    }
          }
