/**
 * recommendation.js
 *
 * Produces a recommendation from evaluated options.
 *
 * The recommendation is advisory.
 * Human review remains separate.
 */

export class Recommendation {
    constructor(options = {}) {
        this.minimumScore =
            options.minimumScore ?? 0.55;

        this.minimumConfidence =
            options.minimumConfidence ?? 0.50;
    }

    generate(options = [], context = {}) {
        if (!Array.isArray(options) || options.length === 0) {
            return {
                status: "no-options",
                selected: null,
                alternatives: [],
                rationale: [
                    "No candidate options were available."
                ]
            };
        }

        const ranked =
            this.rank(options);

        const selected =
            ranked[0];

        const score =
            selected.tradeoffs?.score ?? 0;

        const confidence =
            selected.confidence?.score ?? 0;

        let status = "recommended";

        if (
            score < this.minimumScore ||
            confidence < this.minimumConfidence
        ) {
            status = "insufficient-confidence";
        }

        return {
            status,

            selected,

            alternatives:
                ranked.slice(1),

            rationale:
                this.buildRationale(selected),

            generatedAt: Date.now()
        };
    }

    rank(options) {
        return [...options].sort(
            (a, b) => {
                const scoreA =
                    a.tradeoffs?.score ?? 0;

                const scoreB =
                    b.tradeoffs?.score ?? 0;

                if (scoreA !== scoreB) {
                    return scoreB - scoreA;
                }

                const confidenceA =
                    a.confidence?.score ?? 0;

                const confidenceB =
                    b.confidence?.score ?? 0;

                return confidenceB - confidenceA;
            }
        );
    }

    buildRationale(option) {
        if (!option) {
            return [];
        }

        const rationale = [];

        if (
            option.tradeoffs?.score >= 0.65
        ) {
            rationale.push(
                "The option has a favorable overall trade-off."
            );
        }

        if (
            option.risk?.score <= 0.3
        ) {
            rationale.push(
                "Estimated risk is relatively low."
            );
        }

        if (
            option.consequences?.benefit >= 0.6
        ) {
            rationale.push(
                "Expected benefit is relatively strong."
            );
        }

        if (
            option.confidence?.score < 0.5
        ) {
            rationale.push(
                "Confidence is limited and additional information may be useful."
            );
        }

        if (rationale.length === 0) {
            rationale.push(
                "The recommendation requires contextual human review."
            );
        }

        return rationale;
    }
          }
