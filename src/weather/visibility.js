'use strict';

class Visibility {
    analyze(data = {}) {
        const distance =
            Number(
                data.distance
            );

        if (
            !Number.isFinite(distance)
        ) {
            return {
                distance: null,
                unit: data.unit || 'km',
                category: 'unknown',
                score: null
            };
        }

        const score =
            this.calculateScore(
                distance,
                data.unit || 'km'
            );

        return {
            distance,

            unit:
                data.unit || 'km',

            category:
                this.classify(
                    distance,
                    data.unit || 'km'
                ),

            score
        };
    }

    classify(
        distance,
        unit = 'km'
    ) {
        const km =
            this.toKilometers(
                distance,
                unit
            );

        if (km < 0.2) {
            return 'very_poor';
        }

        if (km < 1) {
            return 'poor';
        }

        if (km < 5) {
            return 'moderate';
        }

        if (km < 10) {
            return 'good';
        }

        return 'excellent';
    }

    calculateScore(
        distance,
        unit = 'km'
    ) {
        const km =
            this.toKilometers(
                distance,
                unit
            );

        return Math.max(
            0,
            Math.min(
                1,
                km / 10
            )
        );
    }

    toKilometers(
        value,
        unit
    ) {
        switch (
            String(unit).toLowerCase()
        ) {
            case 'm':
            case 'meter':
            case 'meters':
                return value / 1000;

            case 'mi':
            case 'mile':
            case 'miles':
                return value * 1.60934;

            default:
                return value;
        }
    }
}

module.exports = Visibility;
