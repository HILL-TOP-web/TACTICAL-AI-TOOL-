'use strict';

const { getMonnifyConfig } = require('./MonnifyConfig');

const {
    normalizeProviderStatus
} = require('../PayoutStatus');

class MonnifyTransferStatus {
    constructor({
        auth,
        fetchImpl = globalThis.fetch
    }) {
        if (!auth) {
            throw new Error('MonnifyAuth is required.');
        }

        this.auth = auth;
        this.fetch = fetchImpl;
    }

    async getTransferStatus({
        reference
    }) {
        if (
            typeof reference !== 'string' ||
            !reference.trim()
        ) {
            throw new Error(
                'A transfer reference is required.'
            );
        }

        const config = getMonnifyConfig();

        const token = await this.auth.getAccessToken();

        const url = new URL(
            `${config.baseUrl}${config.statusPath}`
        );

        /*
         * Confirm the exact query parameter required by your
         * Monnify account's current status API documentation.
         */
        url.searchParams.set(
            'paymentReference',
            reference
        );

        const response = await this.fetch(url, {
            method: 'GET',

            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },

            signal: AbortSignal.timeout(config.timeoutMs)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                'Unable to verify transfer status with Monnify.'
            );
        }

        if (
            result.requestSuccessful !== true ||
            !result.responseBody
        ) {
            throw new Error(
                'Monnify returned no verifiable transfer status.'
            );
        }

        const body = result.responseBody;

        return {
            provider: 'monnify',

            reference,

            providerReference:
                body.reference || reference,

            providerStatus: body.status || 'PENDING',

            status: normalizeProviderStatus(body.status),

            verified: true
        };
    }
}

module.exports = MonnifyTransferStatus;
