'use strict';

const crypto = require('node:crypto');

const ALLOWED_EVENT_TYPES = new Set([
    'authentication_success',
    'authentication_failure',
    'authorization_failure',
    'transaction_authorized',
    'transaction_rejected',
    'withdrawal_requested',
    'transfer_requested',
    'rate_limit_exceeded',
    'monnify_configuration_failure',
    'monnify_verification_success',
    'monnify_verification_failure',
    'transaction_reconciliation',
    'security_setting_changed',
    'suspicious_activity'
]);

const SENSITIVE_KEY_PATTERN =
    /password|secret|token|authorization|api.?key|account.?number|card.?number|cvv|otp/i;

function sanitizeMetadata(value, depth = 0) {
    if (depth > 5) {
        return '[MAX_DEPTH]';
    }

    if (value === null) {
        return null;
    }

    if (
        typeof value === 'string' ||
        typeof value === 'boolean'
    ) {
        return value;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : '[INVALID_NUMBER]';
    }

    if (Array.isArray(value)) {
        return value.slice(0, 50).map((item) => {
            return sanitizeMetadata(item, depth + 1);
        });
    }

    if (typeof value === 'object') {
        const output = {};

        for (const [key, item] of Object.entries(value)) {
            if (SENSITIVE_KEY_PATTERN.test(key)) {
                output[key] = '[REDACTED]';
                continue;
            }

            output[key] = sanitizeMetadata(item, depth + 1);
        }

        return output;
    }

    return '[UNSUPPORTED_VALUE]';
}

class SecurityAudit {
    constructor(options = {}) {
        const {
            repository,
            clock = () => new Date()
        } = options;

        if (!repository || typeof repository.append !== 'function') {
            throw new Error(
                'SecurityAudit requires a repository with append().'
            );
        }

        this.repository = repository;
        this.clock = clock;
    }

    async record({
        eventType,
        userId = null,
        transactionReference = null,
        source = 'application',
        outcome = 'unknown',
        metadata = {}
    }) {
        if (!ALLOWED_EVENT_TYPES.has(eventType)) {
            throw new Error('Unsupported security audit event type.');
        }

        const record = {
            eventId: crypto.randomUUID(),
            eventType,
            userId,
            transactionReference,
            source,
            outcome,
            metadata: sanitizeMetadata(metadata),
            timestamp: this.clock().toISOString()
        };

        /*
         * Persist this event in an append-only audit repository.
         * Do not silently ignore persistence failures.
         */
        return this.repository.append(record);
    }

    async recordAuthorizationFailure(details = {}) {
        return this.record({
            eventType: 'authorization_failure',
            userId: details.userId || null,
            transactionReference:
                details.transactionReference || null,
            source: details.source || 'authorization',
            outcome: 'denied',
            metadata: {
                reason: details.reason || 'Authorization denied'
            }
        });
    }

    async recordWithdrawalRequest(details = {}) {
        return this.record({
            eventType: 'withdrawal_requested',
            userId: details.userId,
            transactionReference: details.transactionReference,
            source: 'withdrawal_service',
            outcome: 'requested',
            metadata: {
                provider: details.provider || 'unknown',
                currency: details.currency || null,
                amount: details.amount
            }
        });
    }

    async recordMonnifyVerification(details = {}) {
        const successful = details.verified === true;

        return this.record({
            eventType: successful
                ? 'monnify_verification_success'
                : 'monnify_verification_failure',

            userId: details.userId || null,

            transactionReference:
                details.transactionReference || null,

            source: 'monnify',

            outcome: successful ? 'verified' : 'not_verified',

            metadata: {
                reason: details.reason || null,
                providerStatus: details.providerStatus || null
            }
        });
    }
}

module.exports = {
    SecurityAudit,
    ALLOWED_EVENT_TYPES,
    sanitizeMetadata
};
