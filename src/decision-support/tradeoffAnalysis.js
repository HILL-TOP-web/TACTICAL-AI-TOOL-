/**
 * tradeoffAnalysis.js
 *
 * Balances benefits, risks, costs and other decision factors.
 */

export class TradeoffAnalysis {
    constructor(options = {}) {
        this.weights = {
            benefit:
                options.benefitWeight ?? 0.35,

            risk:
                options.riskWeight ?? 0.30,

            cost:
                options.costWeight ?? 0.20,

            confidence:
                options.confidenceWeight ?? 0.15
        };
    }

    evaluate(option, data = {}) {
        const risk =
            data.risk?.score ?? 0.5;

        const benefit =
            data.consequences?.benefit ?? 0.5;

        const cost =
            data.consequences?.cost ?? 0.5;

        const confidence =
            option.confidence ?? 0.5;

        const score =
            benefit *
            this.weights.benefit +

            (1 - risk) *
            this.weights.risk +

            (1 - cost) *
            this.weights.cost +

            confidence *
            this.weights.confidence;

        return {
            score: this.clamp(score),

            benefit,

            risk,

            cost,

            confidence,

            interpretation:
                this.interpret(score)
        };
    }

    interpret(score) {
        if (score >= 0.8) {
            return "strong";
        }

        if (score >= 0.65) {
            return "favorable";
        }

        if (score >= 0.45) {
            return "mixed";
        }

        if (score >= 0.3) {
            return "unfavorable";
        }

        return "poor";
    }

    compare(a, b) {
        const scoreA =
            a.tradeoffs?.score ?? 0;

        const scoreB =
            b.tradeoffs?.score ?? 0;

        return scoreB - scoreA;
    }

    rank(options) {
        return [...options].sort(
            (a, b) => this.compare(a, b)
        );
    }

    clamp(value) {
        return Math.max(
            0,
            Math.min(1, Number(value) || 0)
        );
    }
}
