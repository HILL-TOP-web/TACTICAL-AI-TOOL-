'use strict';

require('dotenv').config();

const REQUIRED_ENV = [
    'MONNIFY_BASE_URL',
    'MONNIFY_API_KEY',
    'MONNIFY_SECRET_KEY',
    'MONNIFY_CONTRACT_CODE'
];

class MonnifyWithdrawalGateway {
    constructor(options = {}) {
        this.client = options.client || null;
        this.config = options.config || null;
        this.auth = options.auth || null;
        this.statusClient = options.statusClient || null;

        this.fetch =
            options.fetch ||
            (typeof globalThis.fetch === 'function'
                ? globalThis.fetch.bind(globalThis)
                : null);

        this.timeoutMs = options.timeoutMs || 15000;
    }

    validateEnvironment() {
        const missing = REQUIRED_ENV.filter((key) => {
            return (
                typeof process.env[key] !== 'string' ||
                !process.env[key].trim()
            );
        });

        if (missing.length > 0) {
            throw new Error(
                `Missing required Monnify environment variables: ${missing.join(', ')}`
            );
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(
                process.env.MONNIFY_BASE_URL
            );
        } catch {
            throw new Error(
                'MONNIFY_BASE_URL must be a valid URL.'
            );
        }

        if (
            !['https:', 'http:'].includes(parsedUrl.protocol)
        ) {
            throw new Error(
                'MONNIFY_BASE_URL must use HTTP or HTTPS.'
            );
        }

        if (
            process.env.NODE_ENV === 'production' &&
            parsedUrl.protocol !== 'https:'
        ) {
            throw new Error(
                'Monnify must use HTTPS in production.'
            );
        }

        return true;
    }

    getBaseUrl() {
        this.validateEnvironment();

        return process.env.MONNIFY_BASE_URL.replace(/\/+$/, '');
    }

    async checkConnectivity() {
        this.validateEnvironment();

        if (this.client && typeof this.client.healthCheck === 'function') {
            return this.client.healthCheck();
        }

        if (this.config && typeof this.config.getBaseUrl === 'function') {
            const configuredUrl = this.config.getBaseUrl();

            if (configuredUrl !== this.getBaseUrl()) {
                throw new Error(
                    'Monnify configuration does not match the environment.'
                );
            }
        }

        if (!this.fetch) {
            throw new Error(
                'Fetch is unavailable. Inject a supported Monnify client.'
            );
        }

        const controller = new AbortController();

        const timeout = setTimeout(
            () => controller.abort(),
            this.timeoutMs
        );

        try {
            /*
             * This checks whether the configured API host responds.
             * It does NOT prove that credentials are valid or that
             * disbursements are enabled.
             */
            const response = await this.fetch(
                this.getBaseUrl(),
                {
                    method: 'GET',
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

            return {
                reachable: true,
                httpStatus: response.status,
                authenticated: false,
                disbursementVerified: false
            };
        } catch (error) {
            throw new Error(
                `Monnify connectivity check failed: ${error.name === 'AbortError' ? 'request timed out' : 'host unavailable'}`
            );
        } finally {
            clearTimeout(timeout);
        }
    }

    async submitWithdrawal(withdrawal) {
        this.validateEnvironment();

        if (
            !withdrawal ||
            typeof withdrawal !== 'object'
        ) {
            throw new Error(
                'A valid withdrawal payload is required.'
            );
        }

        /*
         * Prefer the project's existing Monnify client.
         * The client should authenticate using MonnifyAuths.js
         * and use MonnifyConfig.js for its configuration.
         */
        if (
            this.client &&
            typeof this.client.createDisbursement === 'function'
        ) {
            return this.client.createDisbursement({
                amount: withdrawal.amount,
                reference: withdrawal.reference,
                narration: 'SkyDrop withdrawal',
                destinationBankCode:
                    withdrawal.recipient.bankCode,
                destinationAccountNumber:
                    withdrawal.recipient.accountNumber,
                destinationAccountName:
                    withdrawal.recipient.accountName,
                currency: 'NGN',
                idempotencyKey: withdrawal.idempotencyKey
            });
        }

        /*
         * Do not guess the Monnify API endpoint or authentication
         * format here. Inject an adapter backed by the official
         * API documentation and your existing auth/config modules.
         */
        throw new Error(
            'Monnify disbursement client is not configured. Inject a client implementing createDisbursement().'
        );
    }

    async getWithdrawalStatus(reference) {
        if (
            typeof reference !== 'string' ||
            !reference.trim()
        ) {
            throw new Error(
                'A valid withdrawal reference is required.'
            );
        }

        if (
            this.statusClient &&
            typeof this.statusClient.getTransactionStatus === 'function'
        ) {
            return this.statusClient.getTransactionStatus(
                reference.trim()
            );
        }

        if (
            this.client &&
            typeof this.client.getDisbursementStatus === 'function'
        ) {
            return this.client.getDisbursementStatus(
                reference.trim()
            );
        }

        throw new Error(
            'Monnify transaction-status client is not configured.'
        );
    }
}

module.exports = MonnifyWithdrawalGateway;
