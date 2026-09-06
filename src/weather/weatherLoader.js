'use strict';

class WeatherLoader {
    constructor(options = {}) {
        this.options = {
            timeoutMs: options.timeoutMs ?? 10000,
            retries: options.retries ?? 2,
            provider: options.provider || null,
            ...options
        };
    }

    async load(location, options = {}) {
        if (!location) {
            throw new Error('Weather location is required');
        }

        // Allows tests, simulations, or local datasets
        // to provide weather without an external API.
        if (options.data) {
            return options.data;
        }

        if (typeof this.options.provider === 'function') {
            return this.options.provider(
                location,
                options
            );
        }

        if (options.url) {
            return this.loadFromUrl(
                options.url,
                options
            );
        }

        throw new Error(
            'No weather provider configured'
        );
    }

    async loadFromUrl(url, options = {}) {
        const fetchImpl =
            options.fetch ||
            globalThis.fetch;

        if (typeof fetchImpl !== 'function') {
            throw new Error(
                'Fetch implementation is unavailable'
            );
        }

        let lastError = null;

        for (
            let attempt = 0;
            attempt <= this.options.retries;
            attempt++
        ) {
            try {
                const controller =
                    new AbortController();

                const timeout =
                    setTimeout(
                        () =>
                            controller.abort(),
                        this.options.timeoutMs
                    );

                const response =
                    await fetchImpl(
                        url,
                        {
                            method: 'GET',
                            headers:
                                options.headers || {},
                            signal:
                                controller.signal
                        }
                    );

                clearTimeout(timeout);

                if (!response.ok) {
                    throw new Error(
                        `Weather request failed: ${response.status}`
                    );
                }

                return await response.json();
            } catch (error) {
                lastError = error;

                if (
                    attempt <
                    this.options.retries
                ) {
                    await this.delay(
                        250 * (attempt + 1)
                    );
                }
            }
        }

        throw lastError;
    }

    async delay(ms) {
        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    ms
                )
        );
    }
}

module.exports = WeatherLoader;
