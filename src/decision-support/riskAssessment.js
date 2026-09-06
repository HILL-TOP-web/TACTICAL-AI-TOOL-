/**
 * riskAssessment.js
 *
 * Generic risk evaluation.
 *
 * Risk categories:
 * - uncertainty
 * - complexity
 * - dependency
 * - reversibility
 * - resource
 */

export class RiskAssessment {
    constructor(options = {}) {
        this.weights = {
            uncertainty:
                options.uncertaintyWeight ?? 0.25,

            complexity:
                options.complexityWeight ?? 0.15,

            dependency:
                options.dependencyWeight ?? 0.15,

            reversibility:
                options.reversibilityWeight ?? 0.25,

            resource:
                options.resourceWeight ?? 0.20
        };
    }

    evaluate(option, context = {}) {
        const factors = {
            uncertainty: this.getUncertainty(
                option,
                context
            ),

            complexity: this.getComplexity(
                option,
                context
            ),

            dependency: this.getDependency(
                option,
                context
            ),

            reversibility: this.getReversibility(
                option,
                context
            ),

            resource: this.getResourceRisk(
                option,
                context
            )
        };

        let score = 0;

        for (const [key, value] of Object.entries(factors)) {
            score +=
                value *
                (this.weights[key] || 0);
        }

        return {
            score: this.clamp(score),
            level: this.level(score),
            factors
        };
    }

    getUncertainty(option, context) {
        return this.clamp(
            context.uncertainty ??
            option.uncertainty ??
            0.5
        );
    }

    getComplexity(option, context) {
        return this.clamp(
            option.complexity ??
            context.complexity ??
            0.3
        );
    }

    getDependency(option, context) {
        const dependencies =
            option.dependencies ||
            context.dependencies ||
            [];

        return this.clamp(
            dependencies.length / 10
        );
    }

    getReversibility(option, context) {
        const reversibility =
            option.reversibility ??
            context.reversibility ??
            0.5;

        // Higher reversibility = lower risk.
        return this.clamp(
            1 - reversibility
        );
    }

    getResourceRisk(option, context) {
        return this.clamp(
            option.resourceRisk ??
            context.resourceRisk ??
            0.3
        );
    }

    level(score) {
        if (score < 0.25) {
            return "low";
        }

        if (score < 0.5) {
            return "moderate";
        }

        if (score < 0.75) {
            return "high";
        }

        return "very-high";
    }

    clamp(value) {
        return Math.max(
            0,
            Math.min(1, Number(value) || 0)
        );
    }
        }
