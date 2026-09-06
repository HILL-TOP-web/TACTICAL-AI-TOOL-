'use strict';

class WeatherCache {
    constructor(options = {}) {
        this.options = {
            ttlMs:
                options.ttlMs ??
                10 * 60 * 1000,

            maxEntries:
                options.maxEntries ||
                500,

            ...options
        };

        this.cache = new Map();
    }

    set(
        key,
        value,
        ttlMs = this.options.ttlMs
    ) {
        if (!key) {
            throw new Error(
                'Cache key is required'
            );
        }

        const entry = {
            value,

            createdAt:
                Date.now(),

            expiresAt:
                Date.now() +
                ttlMs
        };

        this.cache.set(
            key,
            entry
        );

        this.enforceLimit();

        return value;
    }

    get(key) {
        const entry =
            this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (
            Date.now() >
            entry.expiresAt
        ) {
            this.cache.delete(key);

            return null;
        }

        return entry.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    delete(key) {
        return this.cache.delete(
            key
        );
    }

    clear() {
        this.cache.clear();
    }

    cleanup() {
        const now = Date.now();

        for (
            const [key, entry]
            of this.cache
        ) {
            if (
                now >
                entry.expiresAt
            ) {
                this.cache.delete(key);
            }
        }
    }

    size() {
        return this.cache.size;
    }

    keys() {
        this.cleanup();

        return [
            ...this.cache.keys()
        ];
    }

    enforceLimit() {
        while (
            this.cache.size >
            this.options.maxEntries
        ) {
            const oldest =
                this.cache.entries()
                    .next()
                    .value;

            if (!oldest) {
                break;
            }

            this.cache.delete(
                oldest[0]
            );
        }
    }

    createKey(
        location,
        options = {}
    ) {
        return JSON.stringify({
            location,
            date:
                options.date || null,
            hour:
                options.hour || null
        });
    }
}

module.exports = WeatherCache;
