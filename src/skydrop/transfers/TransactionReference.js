'use strict';

const crypto = require('node:crypto');

const INTERNAL_REFERENCE_PREFIX = 'SKD-TXN';

function generateTransactionReference() {
    const timestamp = Date.now().toString(36).toUpperCase();

    const randomPart = crypto
        .randomBytes(12)
        .toString('hex')
        .toUpperCase();

    return `${INTERNAL_REFERENCE_PREFIX}-${timestamp}-${randomPart}`;
}

function generateIdempotencyKey() {
    return crypto.randomUUID();
}

function validateTransactionReference(reference) {
    if (typeof reference !== 'string') {
        return false;
    }

    return /^SKD-TXN-[A-Z0-9]+-[A-F0-9]{24}$/.test(reference);
}

function normalizeProviderReference(reference) {
    if (typeof reference !== 'string') {
        throw new Error('Provider reference must be a string.');
    }

    const normalized = reference.trim();

    if (!normalized) {
        throw new Error('Provider reference cannot be empty.');
    }

    return normalized;
}

function createReferenceRecord(options = {}) {
    const {
        provider = null,
        providerReference = null
    } = options;

    return {
        internalReference: generateTransactionReference(),

        provider: provider
            ? String(provider).trim().toLowerCase()
            : null,

        providerReference: providerReference
            ? normalizeProviderReference(providerReference)
            : null,

        createdAt: new Date().toISOString()
    };
}

module.exports = {
    INTERNAL_REFERENCE_PREFIX,
    generateTransactionReference,
    generateIdempotencyKey,
    validateTransactionReference,
    normalizeProviderReference,
    createReferenceRecord
};
