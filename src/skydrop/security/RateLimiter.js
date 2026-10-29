'use strict';

const mongoose = require('mongoose');

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS = 10;

const RateLimitCounterSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true
        },

        count: {
            type: Number,
            required: true,
            default: 0
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        collection: 'skydrop_rate_limit_counters',
        timestamps: true,
        versionKey: false
    }
);

RateLimitCounterSchema.index(
    { key: 1 },
    { unique: true }
);

RateLimitCounterSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

const RateLimitCounter =
    mongoose.models.SkyDropRateLimitCounter ||
    mongoose.model(
        'SkyDropRateLimitCounter',
        RateLimitCounterSchema
    );

class RateLimiter {
    constructor({
        windowMs = DEFAULT_WINDOW_MS,
        maxRequests = DEFAULT_MAX_REQUESTS,
        model = RateLimitCounter,
        keyPrefix = 'financial'
    } = {}) {
        if (
            !Number.isSafeInteger(windowMs) ||
            windowMs < 1000
        ) {
            throw new TypeError('Invalid rate-limit window.');
        }

        if (
            !Number.isSafeInteger(maxRequests) ||
            maxRequests < 1
        ) {
            throw new TypeError('Invalid maximum request count.');
        }

        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.model = model;
        this.keyPrefix = keyPrefix;
    }

    async consume(key) {
        if (!key || typeof key !== 'string') {
            throw new TypeError(
                'A rate-limit key is required.'
            );
        }

        const now = new Date();
        const expiresAt = new Date(
            now.getTime() + this.windowMs
        );

        const databaseKey = `${this.keyPrefix}:${key}`;

        /*
         * Atomic increment. A fresh counter receives a new expiry.
         * An expired counter is reset when its next request arrives.
         */
        const counter = await this.model.findOneAndUpdate(
            {
                key: databaseKey,
                expiresAt: { $gt: now }
            },
            {
                $inc: { count: 1 }
            },
            {
                new: true
            }
        ).lean();

        let current = counter;

        if (!current) {
            try {
                current = await this.model.findOneAndUpdate(
                    { key: databaseKey },
                    {
                        $set: {
                            count: 1,
                            expiresAt
                        },
                        $setOnInsert: {
                            key: databaseKey
                        }
                    },
                    {
                        upsert: true,
                        new: true,
                        setDefaultsOnInsert: true
                    }
                ).lean();
            } catch (error) {
                /*
                 * A simultaneous first request may race to create
                 * the unique key. Retry as an atomic increment.
                 */
                if (error.code !== 11000) {
                    throw error;
                }

                current = await this.model.findOneAndUpdate(
                    { key: databaseKey },
                    {
                        $inc: { count: 1 },
                        $set: { expiresAt }
                    },
                    { new: true }
                ).lean();
            }
        }

        const count = current.count;

        return {
            allowed: count <= this.maxRequests,
            limit: this.maxRequests,
            remaining: Math.max(
                0,
                this.maxRequests - count
            ),
            resetAt: current.expiresAt
        };
    }

    middleware({ keyGenerator } = {}) {
        return async (req, res, next) => {
            try {
                const identity = keyGenerator
                    ? keyGenerator(req)
                    : req.user?._id
                        ? `user:${req.user._id}`
                        : `ip:${req.ip}`;

                if (!identity) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'RATE_LIMIT_IDENTITY_MISSING',
                            message: 'Unable to identify this request.'
                        }
                    });
                }

                const result = await this.consume(
                    String(identity)
                );

                res.setHeader(
                    'RateLimit-Limit',
                    String(result.limit)
                );

                res.setHeader(
                    'RateLimit-Remaining',
                    String(result.remaining)
                );

                res.setHeader(
                    'RateLimit-Reset',
                    String(Math.ceil(
                        result.resetAt.getTime() / 1000
                    ))
                );

                if (!result.allowed) {
                    res.setHeader(
                        'Retry-After',
                        String(Math.max(
                            1,
                            Math.ceil(
                                (result.resetAt.getTime() -
                                    Date.now()) / 1000
                            )
                        ))
                    );

                    return res.status(429).json({
                        success: false,
                        error: {
                            code: 'RATE_LIMIT_EXCEEDED',
                            message: 'Too many requests. Try again later.'
                        }
                    });
                }

                return next();
            } catch (error) {
                /*
                 * Fail closed for financial endpoints.
                 * Do not allow financial requests to bypass a
                 * rate limiter because its database is unavailable.
                 */
                return res.status(503).json({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_SERVICE_UNAVAILABLE',
                        message: 'Financial request protection is temporarily unavailable.'
                    }
                });
            }
        };
    }
}

module.exports = {
    RateLimiter,
    RateLimitCounter
};
