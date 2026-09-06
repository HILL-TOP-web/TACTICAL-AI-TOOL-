/**
 * confidenceScore.js
 *
 * Estimates how reliable the decision-support output is.
 */

export class ConfidenceScore {
    constructor(options = {}) {
        this.weights = {
            dataQuality:
                options.dataQualityWeight ?? 0.30,

            informationCompleteness:
                options.completenessWeight ?? 0.25,

            consistency:
                options.consistencyWeight ?? 0.20,

            modelAgreement:
                options.modelAgreementWeight ?? 0.15,

            reversibility:
                options.reversibilityWeight ?? 0.10
        };
    }

    calculate(data = {}) {
        const factors = {
            dataQuality:
                this.getDataQuality(data),

            informationCompleteness:
                this.getCompleteness(data),

            consistency:
                this.getConsistency(data),

            modelAgreement:
                this.getModelAgreement(data),

            reversibility:
                this.getReversibility(data)
        };

        let score = 0;

        for (const [key, value] of Object.entries(factors)) {
            score +=
                value *
                (this.weights[key] || 0);
        }

        score = this.clamp(score);

        return {
            score,

            level:
                this.level(score),

            factors
        };
    }

    getDataQuality(data) {
        return this.clamp(
            data.context?.dataQuality ??
            0.7
        );
    }

    getCompleteness(data) {
        return this.clamp(
            data.context?.informationCompleteness ??
            0.6
        );
    }

    getConsistency(data) {
        return this.clamp(
            data.context?.consistency ??
            0.7
        );
    }

    getModelAgreement(data) {
        const risk =
            data.risk?.score ?? 0.5;

        const consequence =
            data.consequences?.uncertainty ?? 0.5;

        return this.clamp(
            1 -
            Math.abs(
                risk - consequence
            )
        );
    }

    getReversibility(data) {
        return this.clamp(
            data.option?.reversibility ??
            data.context?.reversibility ??
            0.5
        );
    }

    level(score) {
        if (score >= 0.85) {
            return "very-high";
        }

        if (score >= 0.7) {
            return "high";
        }

        if (score >= 0.5) {
            return "moderate";
        }

        if (score >= 0.3) {
            return "low";
        }

        return "very-low";
    }

    clamp(value) {
        return Math.max(
            0,
            Math.min(1, Number(value) || 0)
        );
    }
  }
