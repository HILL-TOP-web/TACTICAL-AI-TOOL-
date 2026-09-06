/**
 * randomization.js
 *
 * Seedable pseudo-random number generator.
 *
 * Useful for:
 * - Repeatable simulations
 * - Testing
 * - Scenario comparison
 * - Replay generation
 */

export class Randomization {
    constructor(seed = Date.now()) {
        this.initialSeed = this._normalizeSeed(seed);

        this.seed = this.initialSeed;
    }

    _normalizeSeed(seed) {
        if (typeof seed === "string") {
            let hash = 0;

            for (let i = 0; i < seed.length; i++) {
                hash =
                    ((hash << 5) - hash) +
                    seed.charCodeAt(i);

                hash |= 0;
            }

            return Math.abs(hash) || 1;
        }

        return Math.abs(
            Math.floor(seed)
        ) || 1;
    }

    next() {
        /*
         * Mulberry32-style deterministic generator.
         */
        let t =
            this.seed += 0x6D2B79F5;

        t =
            Math.imul(
                t ^ (t >>> 15),
                t | 1
            );

        t ^= t +
            Math.imul(
                t ^ (t >>> 7),
                t | 61
            );

        return (
            ((t ^ (t >>> 14)) >>> 0)
            / 4294967296
        );
    }

    float(min = 0, max = 1) {
        return min +
            this.next() *
            (max - min);
    }

    int(min, max) {
        if (max < min) {
            throw new Error(
                "max must be >= min"
            );
        }

        return Math.floor(
            this.float(min, max + 1)
        );
    }

    chance(probability) {
        if (probability <= 0) {
            return false;
        }

        if (probability >= 1) {
            return true;
        }

        return this.next() < probability;
    }

    choice(array) {
        if (
            !Array.isArray(array) ||
            array.length === 0
        ) {
            return undefined;
        }

        return array[
            this.int(0, array.length - 1)
        ];
    }

    shuffle(array) {
        const result = [...array];

        for (
            let i = result.length - 1;
            i > 0;
            i--
        ) {
            const j = this.int(0, i);

            [
                result[i],
                result[j]
            ] = [
                result[j],
                result[i]
            ];
        }

        return result;
    }

    gaussian(mean = 0, standardDeviation = 1) {
        let u = 0;
        let v = 0;

        while (u === 0) {
            u = this.next();
        }

        while (v === 0) {
            v = this.next();
        }

        const standardNormal =
            Math.sqrt(
                -2 *
                Math.log(u)
            ) *
            Math.cos(
                2 *
                Math.PI *
                v
            );

        return (
            mean +
            standardNormal *
            standardDeviation
        );
    }

    reset() {
        this.seed = this.initialSeed;
    }

    getSeed() {
        return this.seed;
    }
  }
