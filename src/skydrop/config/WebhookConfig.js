'use strict';

class WebhookConfig {

    getMonnifyConfig() {

        const secret = process.env.MONNIFY_SECRET_KEY;

        if (!secret) {
            throw new Error(
                'MONNIFY_SECRET_KEY is required.'
            );
        }

        return {
            provider: 'MONNIFY',
            enabled: process.env.MONNIFY_ENABLED === 'true',
            secretConfigured: true,
            signatureAlgorithm: 'sha512',
            requireRawBody: true,
            maxPayloadBytes: 1024 * 1024
        };
    }

    validate() {

        if (process.env.MONNIFY_ENABLED === 'true') {
            this.getMonnifyConfig();
        }

        return true;
    }
}

module.exports = new WebhookConfig();
