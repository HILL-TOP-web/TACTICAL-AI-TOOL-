/**
 * consequenceModel.js
 *
 * Estimates abstract consequences of candidate options.
 */

export class ConsequenceModel {
    constructor() {
        this.models = new Map();

        this.registerDefaultModels();
    }

    registerModel(name, evaluator) {
        if (typeof evaluator !== "function") {
            throw new Error(
                "Consequence evaluator must be a function"
            );
        }

        this.models.set(name, evaluator);

        return this;
    }

    registerDefaultModels() {
        this.registerModel(
            "benefit",
            (option, context) =>
                option.benefit ??
                context.expectedBenefit ??
                0.5
        );

        this.registerModel(
            "cost",
            (option, context) =>
                option.cost ??
                context.expectedCost ??
                0.3
        );

        this.registerModel(
            "delay",
            (option, context) =>
                option.delayImpact ??
                context.delayImpact ??
                0.2
        );

        this.registerModel(
            "uncertainty",
            (option, context) =>
                option.consequenceUncertainty ??
                context.uncertainty ??
                0.5
        );
    }

    evaluate(option, context = {}) {
        const consequences = {};

        for (const [name, evaluator] of this.models) {
            let value;

            try {
                value = evaluator(
                    option,
                    context
                );
            } catch {
                value = 0.5;
            }

            consequences[name] =
                this.clamp(value);
        }

        const netValue =
            consequences.benefit -
            consequences.cost -
            consequences.delay;

        return {
            ...consequences,

            netValue,

            classification:
                this.classify(netValue)
        };
    }

    classify(value) {
        if (value >= 0.5) {
            return "strong-positive";
        }

        if (value >= 0.15) {
            return "positive";
        }

        if (value > -0.15) {
            return "neutral";
        }

        if (value > -0.5) {
            return "negative";
        }

        return "strong-negative";
    }

    clamp(value) {
        return Math.max(
            0,
            Math.min(1, Number(value) || 0)
        );
    }
    }
