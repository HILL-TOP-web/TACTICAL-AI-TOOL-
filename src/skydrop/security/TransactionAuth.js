'use strict';

const crypto = require('node:crypto');

const DEFAULT_TTL_MS = 5 * 60 * 1000;

class TransactionAuthError extends Error {
    constructor(message, code = 'TRANSACTION_AUTH_FAILED') {
        super(message);

        this.name = 'TransactionAuthError';
        this.code = code;
        this.statusCode = 403;
    }
}

const SENSITIVE_OPERATIONS = new Set([
    'withdrawal',
    'large_transfer',
    'change_withdrawal_account',
    'security_settings_change',
    'transaction_reversal'
]);

class TransactionAuth {
    constructor({
        challengeRepository,
        ttlMs = DEFAULT_TTL_MS
    } = {}) {
        if (
            !challengeRepository ||
            typeof challengeRepository.create !== 'function' ||
            typeof challengeRepository.consume !== 'function'
        ) {
            throw new TypeError(
                'TransactionAuth requires a persistent challenge repository with create() and consume().'
            );
        }

        if (
            !Number.isSafeInteger(ttlMs) ||
            ttlMs < 1000 ||
            ttlMs > 15 * 60 * 1000
        ) {
            throw new TypeError('Invalid authorization challenge TTL.');
        }

        this.challengeRepository = challengeRepository;
        this.ttlMs = ttlMs;
    }

    requiresAdditionalAuthorization(operation) {
        return SENSITIVE_OPERATIONS.has(
            String(operation || '').trim().toLowerCase()
        );
    }

    async createChallenge({
        userId,
        operation,
        transactionReference
    }) {
        if (!userId || !operation) {
            throw new TransactionAuthError(
                'User and operation are required.',
                'MISSING_AUTH_CONTEXT'
            );
        }

        const normalizedOperation = String(operation)
            .trim()
            .toLowerCase();

        if (!this.requiresAdditionalAuthorization(normalizedOperation)) {
            throw new TransactionAuthError(
                'An authorization challenge is not required for this operation.',
                'UNSUPPORTED_CHALLENGE_OPERATION'
            );
        }

        const challenge = crypto.randomBytes(32).toString('hex');

        const challengeHash = crypto
            .createHash('sha256')
            .update(challenge)
            .digest('hex');

        const expiresAt = new Date(Date.now() + this.ttlMs);

        await this.challengeRepository.create({
            userId: String(userId),
            operation: normalizedOperation,
            transactionReference: transactionReference || null,
            challengeHash,
            expiresAt,
            consumedAt: null
        });

        /*
         * The challenge must be delivered through a trusted,
         * authenticated application channel.
         *
         * This method does not send email, SMS, or OTP messages.
         */
        return {
            challenge,
            expiresAt
        };
    }

    async authorize({
        userId,
        operation,
        challenge,
        transactionReference
    }) {
        if (
            !userId ||
            !operation ||
            typeof challenge !== 'string' ||
            challenge.length !== 64
        ) {
            throw new TransactionAuthError(
                'Valid authorization details are required.',
                'INVALID_AUTH_CONTEXT'
            );
        }

        const normalizedOperation = String(operation)
            .trim()
            .toLowerCase();

        if (!this.requiresAdditionalAuthorization(normalizedOperation)) {
            throw new TransactionAuthError(
                'This operation does not use this authorization flow.',
                'UNSUPPORTED_AUTH_OPERATION'
            );
        }

        const challengeHash = crypto
            .createHash('sha256')
            .update(challenge)
            .digest('hex');

        /*
         * consume() MUST atomically match the hash, user,
         * operation, optional reference and expiry, and mark
         * the challenge consumed in the same database operation.
         *
         * A normal find-then-update sequence is not sufficient.
         */
        const consumed = await this.challengeRepository.consume({
            userId: String(userId),
            operation: normalizedOperation,
            transactionReference: transactionReference || null,
            challengeHash,
            now: new Date()
        });

        if (!consumed) {
            throw new TransactionAuthError(
                'Authorization failed or the challenge has expired.',
                'AUTHORIZATION_REJECTED'
            );
        }

        return {
            authorized: true,
            userId: String(userId),
            operation: normalizedOperation,
            transactionReference: transactionReference || null,
            authorizedAt: new Date()
        };
    }
}

module.exports = {
    TransactionAuth,
    TransactionAuthError,
    SENSITIVE_OPERATIONS
};
