'use strict';

class Temperature {
    analyze(data = {}) {
        const value =
            Number(data.value);

        if (
            !Number.isFinite(value)
        ) {
            return {
                value: null,
                unit: data.unit || 'C',
                category: 'unknown'
            };
        }

        const celsius =
            this.toCelsius(
                value,
                data.unit || 'C'
            );

        return {
            value,

            unit:
                data.unit || 'C',

            celsius,

            fahrenheit:
                this.toFahrenheit(
                    celsius
                ),

            category:
                this.classify(
                    celsius
                )
        };
    }

    classify(celsius) {
        if (celsius < 0) {
            return 'freezing';
        }

        if (celsius < 10) {
            return 'cold';
        }

        if (celsius < 20) {
            return 'cool';
        }

        if (celsius < 30) {
            return 'comfortable';
        }

        if (celsius < 40) {
            return 'hot';
        }

        return 'very_hot';
    }

    toCelsius(
        value,
        unit
    ) {
        switch (
            String(unit).toUpperCase()
        ) {
            case 'F':
                return (
                    value - 32
                ) * 5 / 9;

            case 'K':
                return value - 273.15;

            default:
                return value;
        }
    }

    toFahrenheit(celsius) {
        return (
            celsius * 9 / 5
        ) + 32;
    }

    convert(
        value,
        from,
        to
    ) {
        const celsius =
            this.toCelsius(
                value,
                from
            );

        switch (
            String(to).toUpperCase()
        ) {
            case 'F':
                return this.toFahrenheit(
                    celsius
                );

            case 'K':
                return celsius + 273.15;

            default:
                return celsius;
        }
    }
}

module.exports = Temperature;
