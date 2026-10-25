'use strict';

require('dotenv').config();

const {
    WithdrawalConfig
} = require('./WithdrawalConfig');

const WithdrawalStatus = require('./WithdrawalStatus');

class MonnifyWithdrawalGateway {
    constructor() {
        this.baseUrl = (
            process.env.MONNIFY_BASE_URL || ''
        ).replace(/\/+$/, '');

        this.apiKey = process.env.MONNIFY_API_KEY || '';
        this.secretKey = process.env.MONNIFY_SECRET_KEY || '';
        this.contractCode =
            process.env.MONNIFY_CONTRACT_CODE || '';

        this.enabled =
            process.env.MONNIFY_ENABLED === 'true';

        this.timeoutMs =
            WithdrawalConfig.requestTimeoutMs;
    }

    validateEnvironment() {
        const missing = [];

        if (!this.baseUrl) {
            missing.push('MONNIFY_BASE_URL');
        }

        if (!this.apiKey) {
            missing.push('MONNIFY_API_KEY');
        }

        if (!this.secretKey) {
            missing.push('MONNIFY_SECRET_KEY');
        }

        if (!this.contractCode) {
            missing.push('MONNIFY_CONTRACT_CODE');
        }

        if (missing.length > 0) {
            throw new Error(
                `Missing required Monnify configuration: ${missing.join(', ')}`
            );
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(this.baseUrl);
        } catch {
            throw new Error(
                'MONNIFY_BASE_URL must be a valid URL.'
            );
        }

        if (
            parsedUrl.protocol !== 'https:' &&
            parsedUrl.hostname !== 'localhost'
        ) {
            throw new Error(
                'Monnify must use HTTPS outside localhost.'
            );
        }

        if (!this.enabled) {
            throw new Error(
                'Monnify withdrawals are disabled. Set MONNIFY_ENABLED=true only after verification.'
            );
        }

        if (
            typeof fetch !== 'function' ||
            typeof AbortSignal.timeout !== 'function'
        ) {
            throw new Error(
                'A Node.js runtime supporting fetch and AbortSignal.timeout is required.'
            );
        }

        return true;
    }

    async request(path, options = {}) {
        this.validateEnvironment();

        const response = await fetch(
            `${this.baseUrl}${path}`,
            {
                ...options,
                signal: AbortSignal.timeout(this.timeoutMs),
                headers: {
                    Accept: 'application/json',
                    ...(options.body
                        ? { 'Content-Type': 'application/json' }
                        : {}),
                    ...options.headers
                }
            }
        );

        const text = await response.text();

        let data = {};

        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            throw new Error(
                'Monnify returned an invalid JSON response.'
            );
        }

        if (!response.ok) {
            const error = new Error(
                'Monnify request failed.'
            );

            error.statusCode = response.status;
            error.providerResponse = {
                requestSuccessful: data.requestSuccessful,
                responseCode: data.responseCode
            };

            throw error;
        }

        return data;
    }

    async getAccessToken() {
        this.validateEnvironment();

        const credentials = Buffer.from(
            `${this.apiKey}:${this.secretKey}`
        ).toString('base64');

        const response = await this.request(
            '/api/v1/auth/login',
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${credentials}`
                }
            }
        );

        const token =
            response.responseBody &&
            response.responseBody.accessToken;

        if (
            response.requestSuccessful !== true ||
            typeof token !== 'string' ||
            !token
        ) {
            throw new Error(
                'Monnify authentication was not successful.'
            );
        }

        return token;
    }

    async checkConnectivity() {
        const token = await this.getAccessToken();

        return {
            connected: Boolean(token),
            provider: 'Monnify',
            authenticated: true
        };
    }

    async initiateWithdrawal(request) {
        this.validateEnvironment();

        const token = await this.getAccessToken();

        /*
         * IMPORTANT:
         * Confirm the exact endpoint and required payload for your
         * Monnify disbursement product before enabling this request.
         *
         * Do not assume that an account-transfer endpoint is available
         * merely because your Monnify API credentials work.
         */

        const payload = {
            amount: request.amount,
            reference: request.reference,
            narration: 'SkyDrop withdrawal',
            destinationBankCode: request.bankCode,
            destinationAccountNumber: request.accountNumber,
            destinationAccountName: request.accountName,
            currency: request.currency,
            contractCode: this.contractCode
        };

        /*
         * This is a configurable placeholder path, not a guarantee
         * that it matches your Monnify account's approved API.
         * Set MONNIFY_DISBURSEMENT_PATH to the verified path.
         */

        const disbursementPath =
            process.env.MONNIFY_DISBURSEMENT_PATH;

        if (
            typeof disbursementPath !== 'string' ||
            !disbursementPath.startsWith('/api/')
        ) {
            throw new Error(
                'Set MONNIFY_DISBURSEMENT_PATH to the verified disbursement endpoint before submitting transfers.'
            );
        }

        const response = await this.request(
            disbursementPath,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Idempotency-Key: request.idempotencyKey
                },
                body: JSON.stringify(payload)
            }
        );

        if (response.requestSuccessful !== true) {
            throw new Error(
                'Monnify did not confirm successful request submission.'
            );
        }

        const body = response.responseBody || {};

        /*
         * A successful API submission does not necessarily mean
         * the recipient has received the funds.
         */

        return {
            status: WithdrawalStatus.PROCESSING,
            providerReference:
                body.transactionReference ||
                body.reference ||
                request.reference
        };
    }
}

module.exports = MonnifyWithdrawalGateway;
