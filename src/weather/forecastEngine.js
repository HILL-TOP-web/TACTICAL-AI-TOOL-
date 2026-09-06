'use strict';

class ForecastEngine {
    constructor(options = {}) {
        this.options = {
            smoothingWindow:
                options.smoothingWindow || 3,

            ...options
        };
    }

    forecast(observations = [], options = {}) {
        if (!Array.isArray(observations)) {
            throw new TypeError(
                'Observations must be an array'
            );
        }

        if (!observations.length) {
            return {
                generatedAt: Date.now(),
                points: [],
                summary: null
            };
        }

        const sorted =
            [...observations].sort(
                (a, b) =>
                    a.timestamp -
                    b.timestamp
            );

        const points =
            sorted.map(
                observation =>
                    this.createPoint(
                        observation
                    )
            );

        return {
            generatedAt: Date.now(),

            points,

            summary:
                this.createSummary(
                    points
                )
        };
    }

    createPoint(weather) {
        return {
            timestamp:
                weather.timestamp,

            temperature:
                weather.temperature,

            precipitation:
                weather.precipitation,

            visibility:
                weather.visibility,

            wind:
                weather.wind,

            conditions:
                weather.conditions,

            confidence:
                this.calculateConfidence(
                    weather
                )
        };
    }

    createSummary(points) {
        const temperatures =
            points
                .map(
                    p =>
                        p.temperature?.value
                )
                .filter(
                    v =>
                        typeof v === 'number'
                );

        const precipitation =
            points
                .map(
                    p =>
                        p.precipitation?.probability
                )
                .filter(
                    v =>
                        typeof v === 'number'
                );

        return {
            count:
                points.length,

            temperature:
                this.range(
                    temperatures
                ),

            precipitationProbability:
                this.range(
                    precipitation
                ),

            conditions:
                this.uniqueConditions(
                    points
                )
        };
    }

    calculateConfidence(weather) {
        let score = 0.5;

        if (
            weather.temperature?.value !==
            null
        ) {
            score += 0.1;
        }

        if (
            weather.visibility?.distance !==
            null
        ) {
            score += 0.1;
        }

        if (weather.wind) {
            score += 0.1;
        }

        if (weather.precipitation) {
            score += 0.1;
        }

        if (
            weather.source &&
            weather.source !== 'unknown'
        ) {
            score += 0.1;
        }

        return Math.min(
            score,
            1
        );
    }

    range(values) {
        if (!values.length) {
            return {
                min: null,
                max: null,
                average: null
            };
        }

        const min =
            Math.min(...values);

        const max =
            Math.max(...values);

        const average =
            values.reduce(
                (a, b) => a + b,
                0
            ) / values.length;

        return {
            min,
            max,
            average
        };
    }

    uniqueConditions(points) {
        return [
            ...new Set(
                points
                    .map(
                        point =>
                            point.conditions
                    )
                    .filter(Boolean)
            )
        ];
    }
}

module.exports = ForecastEngine;
