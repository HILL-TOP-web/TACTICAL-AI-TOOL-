'use strict';

const { getMonnifyConfig } = require('./MonnifyConfig');

class MonnifyAuth {
    constructor({
        fetchImpl = globalThis.fetch,
        clock = () => Date.now()
    } = {}) {
        if (typeof fetchImpl !== 'function') {
            throw new Error('Fetch API is required.');
        }

        this.fetch = fetchImpl;
        this.clock = clock;

        this.token = null;
        this.expiresAt = 0;
    }

    async getAccessToken() {
        if (
            this.token &&
            this.clock() < this.expiresAt
        ) {
            return this.token;
        }

        const config = getMonnifyConfig();

        const basicCredentials = Buffer
            .from(
                `${config.apiKey}:${config.secretKey}`
            )
            .toString('base64');

        const response = await this.fetch(
            `${config.baseUrl}/api/v1/auth/login`,
            {
                method: 'POST',

                headers: {
                    Authorization: `Basic ${basicCredentials}`,
                    'Content-Type': 'application/json'
                },

                signal: AbortSignal.timeout(config.timeoutMs)
            }
        );

        const result = await response.json();

        if (
            !response.ok ||
            result.requestSuccessful !== true ||
            !result.responseBody?.accessToken
        ) {
            throw new Error(
                'Monnify authentication failed.'
            );
        }

        this.token = result.responseBody.accessToken;

        const expiresInSeconds = Number(
            result.responseBody.expiresIn || 3600
        );

        /*
         * Refresh one minute before the expected expiry.
         */
        this.expiresAt =
            this.clock() +
            Math.max(60, expiresInSeconds - 60) * 1000;

        return this.token;
    }

    clearToken() {
        this.token = null;
        this.expiresAt = 0;
    }
}

module.exports = MonnifyAuth;
