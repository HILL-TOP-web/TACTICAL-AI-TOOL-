'use strict';

const mongoose = require('mongoose');

const AuditTrailSchema = new mongoose.Schema(
    {
        actorId: {
            type: String,
            default: null,
            index: true
        },

        action: {
            type: String,
            required: true,
            index: true
        },

        resourceType: {
            type: String,
            required: true
        },

        resourceId: {
            type: String,
            default: null,
            index: true
        },

        transactionReference: {
            type: String,
            default: null,
            index: true
        },

        outcome: {
            type: String,
            enum: [
                'success',
                'failure',
                'rejected',
                'pending'
            ],
            required: true
        },

        requestId: {
            type: String,
            default: null
        },

        ipAddress: {
            type: String,
            default: null
        },

        userAgent: {
            type: String,
            default: null
        },

        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        occurredAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true
        }
    },
    {
        collection: 'skydrop_audit_trail',
        timestamps: false,
        versionKey: false,
        strict: true
    }
);

AuditTrailSchema.index({
    resourceType: 1,
    resourceId: 1,
    occurredAt: -1
});

const AuditLog =
    mongoose.models.SkyDropAuditLog ||
    mongoose.model('SkyDropAuditLog', AuditTrailSchema);

const SENSITIVE_KEY_PATTERN =
    /password|secret|token|authorization|cookie|credential|private.?key|account.?number|otp|challenge|signature/i;

function sanitize(value, depth = 0) {
    if (depth > 5) {
        return '[MAX_DEPTH]';
    }

    if (
        value === null ||
        value === undefined ||
        typeof value === 'boolean' ||
        typeof value === 'number'
    ) {
        return value;
    }

    if (typeof value === 'string') {
        return value.length > 500
            ? value.slice(0, 500)
            : value;
    }

    if (Array.isArray(value)) {
        return value
            .slice(0, 50)
            .map(item => sanitize(item, depth + 1));
    }

    if (typeof value !== 'object') {
        return '[UNSUPPORTED_VALUE]';
    }

    const result = {};

    for (const [key, item] of Object.entries(value)) {
        if (SENSITIVE_KEY_PATTERN.test(key)) {
            result[key] = '[REDACTED]';
            continue;
        }

        result[key] = sanitize(item, depth + 1);
    }

    return result;
}

class AuditTrail {
    constructor({ model = AuditLog } = {}) {
        this.model = model;
    }

    async record({
        actorId = null,
        action,
        resourceType,
        resourceId = null,
        transactionReference = null,
        outcome,
        requestId = null,
        ipAddress = null,
        userAgent = null,
        details = {},
        session = null
    }) {
        if (!action || !resourceType || !outcome) {
            throw new TypeError(
                'Audit action, resource type and outcome are required.'
            );
        }

        const allowedOutcomes = new Set([
            'success',
            'failure',
            'rejected',
            'pending'
        ]);

        if (!allowedOutcomes.has(outcome)) {
            throw new TypeError('Invalid audit outcome.');
        }

        const document = {
            actorId: actorId === null
                ? null
                : String(actorId),

            action: String(action).slice(0, 150),

            resourceType: String(resourceType).slice(0, 100),

            resourceId: resourceId === null
                ? null
                : String(resourceId),

            transactionReference: transactionReference === null
                ? null
                : String(transactionReference),

            outcome,

            requestId: requestId === null
                ? null
                : String(requestId).slice(0, 200),

            ipAddress: ipAddress === null
                ? null
                : String(ipAddress).slice(0, 100),

            userAgent: userAgent === null
                ? null
                : String(userAgent).slice(0, 500),

            details: sanitize(details),

            occurredAt: new Date()
        };

        const options = session ? { session } : {};

        const [saved] = await this.model.create(
            [document],
            options
        );

        return saved;
    }
}

module.exports = {
    AuditTrail,
    AuditLog,
    sanitize
};
