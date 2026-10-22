'use strict';

class RateLimitError extends Error {
    constructor(message, retryAfterSeconds) {
        super(message);
        this.name = 'RateLimitError';
        this.code = 'RATE_LIMIT_EXCEEDED';
        this.statusCode = 429;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

class RateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 60 * 1000;
        this.maxRequests = options.maxRequests || 30;

        this.maxEntries = options.maxEntries || 10000;

        if (
            !Number.isFinite(this.windowMs) ||
            this.windowMs <= 0
        ) {
            throw new Error('windowMs must be positive.');
        }

        if (
            !Number.isInteger(this.maxRequests) ||
            this.maxRequests <= 0
        ) {
            throw new Error('maxRequests must be a positive integer.');
        }

        this.store = new Map();

        this.clock = options.clock || (() => Date.now());
    }

    consume(key, options = {}) {
        if (typeof key !== 'string' || !key.trim()) {
            throw new Error('A rate-limit key is required.');
        }

        const now = this.clock();

        const limit = options.maxRequests || this.maxRequests;

        const windowMs = options.windowMs || this.windowMs;

        let record = this.store.get(key);

        if (!record || now >= record.resetAt) {
            record = {
                count: 0,
                resetAt: now + windowMs
            };
        }

        if (record.count >= limit) {
            const retryAfterSeconds = Math.max(
                1,
                Math.ceil((record.resetAt - now) / 1000)
            );

            this.store.set(key, record);

            throw new RateLimitError(
                'Too many requests. Please try again later.',
                retryAfterSeconds
            );
        }

        record.count += 1;

        this.store.set(key, record);

        if (this.store.size > this.maxEntries) {
            this.cleanup();

            if (this.store.size > this.maxEntries) {
                const oldestKey = this.store.keys().next().value;

                if (oldestKey !== undefined) {
                    this.store.delete(oldestKey);
                }
            }
        }

        return {
            allowed: true,
            remaining: Math.max(0, limit - record.count),
            resetAt: new Date(record.resetAt).toISOString()
        };
    }

    cleanup() {
        const now = this.clock();

        for (const [key, record] of this.store.entries()) {
            if (now >= record.resetAt) {
                this.store.delete(key);
            }
        }
    }

    reset(key) {
        this.store.delete(key);
    }

    clear() {
        this.store.clear();
    }

    middleware(options = {}) {
        const limiter = this;

        const keyGenerator = options.keyGenerator || ((req) => {
            if (req.user && req.user.id) {
                return `user:${req.user.id}`;
            }

            return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
        });

        return function rateLimitMiddleware(req, res, next) {
            try {
                const key = keyGenerator(req);

                const result = limiter.consume(key, {
                    maxRequests: options.maxRequests,
                    windowMs: options.windowMs
                });

                res.setHeader(
                    'X-RateLimit-Remaining',
                    String(result.remaining)
                );

                res.setHeader(
                    'X-RateLimit-Reset',
                    result.resetAt
                );

                return next();
            } catch (error) {
                if (!(error instanceof RateLimitError)) {
                    return next(error);
                }

                res.setHeader(
                    'Retry-After',
                    String(error.retryAfterSeconds)
                );

                return res.status(429).json({
                    success: false,
                    code: error.code,
                    message: error.message,
                    retryAfterSeconds: error.retryAfterSeconds
                });
            }
        };
    }
}

module.exports = {
    RateLimiter,
    RateLimitError
};
