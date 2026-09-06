'use strict';

class Precipitation {
    analyze(data = {}) {
        const probability =
            this.clamp(
                Number(
                    data.probability
                ) || 0,
                0,
                1
            );

        const amount =
            Math.max(
                0,
                Number(
                    data.amount
                ) || 0
            );

        const type =
            data.type || 'none';

        return {
            probability,

            amount,

            type,

            intensity:
                this.classifyIntensity(
                    amount
                ),

            likelihood:
                this.classifyProbability(
                    probability
                ),

            present:
                amount > 0 ||
                probability > 0
        };
    }

    classifyProbability(probability) {
        if (probability < 0.2) {
            return 'unlikely';
        }

        if (probability < 0.5) {
            return 'possible';
        }

        if (probability < 0.8) {
            return 'likely';
        }

        return 'very_likely';
    }

    classifyIntensity(amount) {
        if (amount <= 0) {
            return 'none';
        }

        if (amount < 2.5) {
            return 'light';
        }

        if (amount < 10) {
            return 'moderate';
        }

        if (amount < 25) {
            return 'heavy';
        }

        return 'very_heavy';
    }

    estimateAccumulation(
        hourlyAmount,
        hours
    ) {
        return Math.max(
            0,
            Number(hourlyAmount) || 0
        ) * Math.max(
            0,
            Number(hours) || 0
        );
    }

    clamp(value, min, max) {
        return Math.max(
            min,
            Math.min(max, value)
        );
    }
}

module.exports = Precipitation;
