'use strict';

class WeatherImpact {
    constructor(options = {}) {
        this.options = {
            ...options
        };
    }

    evaluate(weather = {}) {
        const precipitation =
            this.precipitationImpact(
                weather.precipitation
            );

        const visibility =
            this.visibilityImpact(
                weather.visibility
            );

        const temperature =
            this.temperatureImpact(
                weather.temperature
            );

        const wind =
            this.windImpact(
                weather.wind
            );

        const overall =
            this.calculateOverall(
                [
                    precipitation.score,
                    visibility.score,
                    temperature.score,
                    wind.score
                ]
            );

        return {
            overall,

            precipitation,

            visibility,

            temperature,

            wind,

            assessment:
                this.assessment(
                    overall
                )
        };
    }

    precipitationImpact(
        precipitation = {}
    ) {
        const probability =
            Number(
                precipitation.probability
            ) || 0;

        const amount =
            Number(
                precipitation.amount
            ) || 0;

        const score =
            Math.min(
                1,
                probability * 0.5 +
                Math.min(
                    amount / 25,
                    1
                ) * 0.5
            );

        return {
            score,
            level:
                this.level(score)
        };
    }

    visibilityImpact(
        visibility = {}
    ) {
        const distance =
            Number(
                visibility.distance
            );

        if (
            !Number.isFinite(distance)
        ) {
            return {
                score: 0.5,
                level: 'unknown'
            };
        }

        const km =
            this.toKilometers(
                distance,
                visibility.unit
            );

        const score =
            1 -
            Math.min(
                km / 10,
                1
            );

        return {
            score,
            level:
                this.level(score)
        };
    }

    temperatureImpact(
        temperature = {}
    ) {
        const value =
            Number(
                temperature.value
            );

        if (
            !Number.isFinite(value)
        ) {
            return {
                score: 0.5,
                level: 'unknown'
            };
        }

        const celsius =
            temperature.unit === 'F'
                ? (value - 32) * 5 / 9
                : value;

        let score = 0;

        if (celsius < 0) {
            score = 0.8;
        } else if (celsius < 10) {
            score = 0.4;
        } else if (celsius > 40) {
            score = 0.9;
        } else if (celsius > 30) {
            score = 0.4;
        } else {
            score = 0.1;
        }

        return {
            score,
            level:
                this.level(score)
        };
    }

    windImpact(wind = {}) {
        const speed =
            Number(
                wind.speedKmh ??
                wind.speed
            ) || 0;

        const speedKmh =
            wind.speedKmh
                ? speed
                : this.toKilometersPerHour(
                    speed,
                    wind.unit
                );

        const score =
            Math.min(
                speedKmh / 60,
                1
            );

        return {
            score,
            level:
                this.level(score)
        };
    }

    calculateOverall(scores) {
        if (!scores.length) {
            return 0;
        }

        return (
            scores.reduce(
                (a, b) => a + b,
                0
            ) / scores.length
        );
    }

    assessment(score) {
        if (score < 0.2) {
            return 'minimal';
        }

        if (score < 0.4) {
            return 'low';
        }

        if (score < 0.6) {
            return 'moderate';
        }

        if (score < 0.8) {
            return 'high';
        }

        return 'severe';
    }

    level(score) {
        return this.assessment(score);
    }

    toKilometers(value, unit) {
        switch (
            String(unit || 'km').toLowerCase()
        ) {
            case 'm':
            case 'meters':
                return value / 1000;

            case 'mi':
            case 'miles':
                return value * 1.60934;

            default:
                return value;
        }
    }

    toKilometersPerHour(
        value,
        unit
    ) {
        switch (
            String(unit || 'km/h').toLowerCase()
        ) {
            case 'm/s':
                return value * 3.6;

            case 'mph':
                return value * 1.60934;

            case 'kn':
            case 'knots':
                return value * 1.852;

            default:
                return value;
        }
    }
}

module.exports = WeatherImpact;
