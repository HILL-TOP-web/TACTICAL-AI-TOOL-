'use strict';

class Wind {
    analyze(data = {}) {
        const speed =
            Math.max(
                0,
                Number(
                    data.speed
                ) || 0
            );

        const gust =
            Math.max(
                speed,
                Number(
                    data.gust
                ) || 0
            );

        const unit =
            data.unit || 'km/h';

        const speedKmh =
            this.toKmh(
                speed,
                unit
            );

        const gustKmh =
            this.toKmh(
                gust,
                unit
            );

        return {
            speed,

            gust,

            unit,

            speedKmh,

            gustKmh,

            direction:
                this.normalizeDirection(
                    data.direction
                ),

            category:
                this.classify(
                    speedKmh
                ),

            gustCategory:
                this.classify(
                    gustKmh
                )
        };
    }

    classify(speedKmh) {
        if (speedKmh < 5) {
            return 'calm';
        }

        if (speedKmh < 20) {
            return 'light';
        }

        if (speedKmh < 40) {
            return 'moderate';
        }

        if (speedKmh < 60) {
            return 'strong';
        }

        return 'very_strong';
    }

    normalizeDirection(direction) {
        if (
            direction === null ||
            direction === undefined
        ) {
            return null;
        }

        if (
            typeof direction === 'string'
        ) {
            return direction.toUpperCase();
        }

        const degrees =
            Number(direction);

        if (
            !Number.isFinite(degrees)
        ) {
            return null;
        }

        const normalized =
            (
                degrees % 360 +
                360
            ) % 360;

        const directions = [
            'N',
            'NE',
            'E',
            'SE',
            'S',
            'SW',
            'W',
            'NW'
        ];

        return directions[
            Math.round(
                normalized / 45
            ) % 8
        ];
    }

    toKmh(
        speed,
        unit
    ) {
        switch (
            String(unit).toLowerCase()
        ) {
            case 'm/s':
            case 'mps':
                return speed * 3.6;

            case 'mph':
                return speed * 1.60934;

            case 'kn':
            case 'knot':
            case 'knots':
                return speed * 1.852;

            default:
                return speed;
        }
    }
}

module.exports = Wind;
