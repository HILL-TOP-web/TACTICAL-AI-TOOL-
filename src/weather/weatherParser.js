'use strict';

class WeatherParser {
    parse(data = {}) {
        if (!data || typeof data !== 'object') {
            throw new TypeError(
                'Weather data must be an object'
            );
        }

        return {
            timestamp:
                this.parseTimestamp(
                    data.timestamp ||
                    data.time ||
                    Date.now()
                ),

            location:
                this.parseLocation(
                    data.location
                ),

            temperature:
                this.parseTemperature(
                    data.temperature
                ),

            precipitation:
                this.parsePrecipitation(
                    data.precipitation
                ),

            visibility:
                this.parseVisibility(
                    data.visibility
                ),

            wind:
                this.parseWind(
                    data.wind
                ),

            conditions:
                data.conditions ||
                data.weather ||
                'unknown',

            humidity:
                this.number(
                    data.humidity
                ),

            pressure:
                this.number(
                    data.pressure
                ),

            cloudCover:
                this.number(
                    data.cloudCover ??
                    data.cloud_cover
                ),

            source:
                data.source || 'unknown',

            metadata:
                data.metadata || {}
        };
    }

    parseLocation(location) {
        if (!location) {
            return null;
        }

        if (typeof location === 'string') {
            return {
                name: location
            };
        }

        return {
            name:
                location.name || null,

            latitude:
                this.number(
                    location.latitude
                ),

            longitude:
                this.number(
                    location.longitude
                ),

            timezone:
                location.timezone || null
        };
    }

    parseTemperature(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return {
                value: null,
                unit: 'C'
            };
        }

        if (
            typeof value === 'number'
        ) {
            return {
                value,
                unit: 'C'
            };
        }

        return {
            value:
                this.number(
                    value.value ??
                    value.temperature
                ),

            unit:
                value.unit || 'C'
        };
    }

    parsePrecipitation(value) {
        if (!value) {
            return {
                probability: 0,
                amount: 0,
                unit: 'mm',
                type: 'none'
            };
        }

        return {
            probability:
                this.clamp(
                    this.number(
                        value.probability ??
                        value.probabilityOfPrecipitation
                    ) || 0,
                    0,
                    1
                ),

            amount:
                this.number(
                    value.amount
                ) || 0,

            unit:
                value.unit || 'mm',

            type:
                value.type || 'none'
        };
    }

    parseVisibility(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return {
                distance: null,
                unit: 'km'
            };
        }

        if (
            typeof value === 'number'
        ) {
            return {
                distance: value,
                unit: 'km'
            };
        }

        return {
            distance:
                this.number(
                    value.distance
                ),

            unit:
                value.unit || 'km'
        };
    }

    parseWind(value) {
        if (!value) {
            return {
                speed: 0,
                direction: null,
                gust: 0,
                unit: 'km/h'
            };
        }

        return {
            speed:
                this.number(
                    value.speed
                ) || 0,

            direction:
                value.direction ??
                null,

            gust:
                this.number(
                    value.gust
                ) || 0,

            unit:
                value.unit || 'km/h'
        };
    }

    parseTimestamp(value) {
        if (typeof value === 'number') {
            return value;
        }

        const parsed =
            Date.parse(value);

        return Number.isNaN(parsed)
            ? Date.now()
            : parsed;
    }

    number(value) {
        const result =
            Number(value);

        return Number.isFinite(result)
            ? result
            : null;
    }

    clamp(value, min, max) {
        return Math.max(
            min,
            Math.min(max, value)
        );
    }
}

module.exports = WeatherParser;
