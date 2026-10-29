'use strict';

const crypto = require('node:crypto');

function getRequiredEnv(name) {
    const value = process.env[name];

    if (typeof value !== 'string' || !value.trim()) {
        throw new Error(
            `Missing required environment variable: ${name}`
        );
    }

    return value.trim();
}

function getPositiveInteger(name, fallback) {
    const value = process.env[name];

    if (value === undefined || value === '') {
        return fallback;
    }

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new Error(`${name} must be a positive integer.`);
    }

    return parsed;
}

function getBoolean(name, fallback = false) {
    const value = process.env[name];

    if (value === undefined || value === '') {
        return fallback;
    }

    if (value === 'true') return true;
    if (value === 'false') return false;

    throw new Error(`${name} must be true or false.`);
}

function getJwtSecret() {
    const secret = getRequiredEnv('SKYDROP_JWT_SECRET');

    if (secret.length < 32) {
        throw new Error(
            'SKYDROP_JWT_SECRET must contain at least 32 characters.'
        );
    }

    return secret;
}

module.exports = Object.freeze({
    getRequiredEnv,
    getPositiveInteger,
    getBoolean,
    getJwtSecret,

    get jwtExpiresIn() {
        return process.env.SKYDROP_JWT_EXPIRES_IN || '15m';
    },

    get refreshTokenEnabled() {
        return getBoolean('SKYDROP_REFRESH_TOKEN_ENABLED', false);
    },

    get passwordMinLength() {
        return getPositiveInteger(
            'SKYDROP_PASSWORD_MIN_LENGTH',
            12
        );
    },

    get loginMaxAttempts() {
        return getPositiveInteger(
            'SKYDROP_LOGIN_MAX_ATTEMPTS',
            5
        );
    },

    get loginLockMinutes() {
        return getPositiveInteger(
            'SKYDROP_LOGIN_LOCK_MINUTES',
            15
        );
    },

    get bcryptRounds() {
        const rounds = getPositiveInteger(
            'SKYDROP_BCRYPT_ROUNDS',
            12
        );

        if (rounds < 10 || rounds > 14) {
            throw new Error(
                'SKYDROP_BCRYPT_ROUNDS must be between 10 and 14.'
            );
        }

        return rounds;
    }
});
