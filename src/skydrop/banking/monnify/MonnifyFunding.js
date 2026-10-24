'use strict';

const crypto = require('crypto');

class MonnifyFunding {
    constructor(options = {}) {
        this.baseUrl = (
            options.baseUrl ||
            process.env.MONNIFY_BASE_URL ||
            ''
        ).replace(/\/+$/, '');

        this.apiKey =
            options.apiKey ||
            process.env.MONNIFY_API_KEY ||
            '';

        this.secretKey =
            options.secretKey ||
            process.env.MONNIFY_SECRET_KEY ||
            '';

        this.contractCode =
            options.contractCode ||
            process.env.MONNIFY_CONTRACT_CODE ||
            '';

        this.timeoutMs = Number(
            options.timeoutMs ||
            process.env.MONNIFY_TIMEOUT_MS ||
            15000
        );

        this.token = null;
        this.tokenExpiresAt = 0;

        this.validateConfiguration();
    }

    validateConfiguration() {
        if (!this.baseUrl || !this.apiKey || !this.secretKey) {
            throw new Error(
                'Monnify configuration is incomplete. ' +
                'Check MONNIFY_BASE_URL, MONNIFY_API_KEY, ' +
                'and MONNIFY_SECRET_KEY in the backend .env.'
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
            !['https:', 'http:'].includes(parsedUrl.protocol) ||
            parsedUrl.username ||
            parsedUrl.password
        ) {
            throw new Error(
                'MONNIFY_BASE_URL is invalid.'
            );
        }

        if (
            parsedUrl.protocol !== 'https:' &&
            parsedUrl.hostname !== 'localhost' &&
            parsedUrl.hostname !== '127.0.0.1'
        ) {
            throw new Error(
                'HTTPS is required for the Monnify API.'
            );
        }

        if (
            !Number.isInteger(this.timeoutMs) ||
            this.timeoutMs < 1000 ||
            this.timeoutMs > 60000
        ) {
            throw new Error(
                'MONNIFY_TIMEOUT_MS must be between 1000 and 60000.'
            );
        }
    }

    /**
     * Obtain and cache a Monnify access token.
     */
    async getAccessToken() {
        if (
            this.token &&
            Date.now() < this.tokenExpiresAt
        ) {
            return this.token;
        }

        const credentials = Buffer.from(
            `${this.apiKey}:${this.secretKey}`
        ).toString('base64');

        const response = await this.request(
            '/api/v1/auth/login',
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${credentials}`
                },
                body: {}
            },
            false
        );

        const accessToken =
            response.responseBody &&
            response.responseBody.accessToken;

        if (
            response.requestSuccessful !== true ||
            typeof accessToken !== 'string' ||
            !accessToken
        ) {
            throw new Error(
                'Monnify authentication failed.'
            );
        }

        const expiresIn = Number(
            response.responseBody.expiresIn || 3600
        );

        this.token = accessToken;

        // Refresh the token slightly before it expires.
        this.tokenExpiresAt =
            Date.now() +
            Math.max(60, expiresIn - 60) * 1000;

        return this.token;
    }

    /**
     * Make a JSON request to the Monnify API.
     * Never logs credentials, access tokens, or response bodies.
     */
    async request(path, options = {}, authenticate = true) {
        const controller = new AbortController();

        const timeout = setTimeout(
            () => controller.abort(),
            this.timeoutMs
        );

        try {
            const headers = {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(options.headers || {})
            };

            if (authenticate) {
                const token = await this.getAccessToken();

                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(
                `${this.baseUrl}${path}`,
                {
                    method: options.method || 'GET',
                    headers,
                    body:
                        options.body === undefined
                            ? undefined
                            : JSON.stringify(options.body),
                    signal: controller.signal
                }
            );

            const result = await response.json().catch(
                () => null
            );

            if (!response.ok) {
                const error = new Error(
                    `Monnify API request failed with HTTP ${response.status}.`
                );

                error.statusCode = 502;
                error.providerHttpStatus = response.status;

                throw error;
            }

            if (!result || typeof result !== 'object') {
                throw new Error(
                    'Monnify returned an invalid response.'
                );
            }

            if (result.requestSuccessful === false) {
                const error = new Error(
                    'Monnify did not accept the request.'
                );

                error.statusCode = 502;
                error.providerCode = result.responseCode;

                throw error;
            }

            return result;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(
                    'Monnify API request timed out.'
                );
            }

            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Basic provider connectivity and credential check.
     *
     * This authenticates with Monnify; it does not move money.
     */
    async checkConnection() {
        const token = await this.getAccessToken();

        return {
            connected: Boolean(token),
            authenticated: true,
            provider: 'Monnify'
        };
    }

    /**
     * Create a collection/funding transaction.
     *
     * This initializes a payment request; it does not credit
     * a SkyDrop wallet. Wallet crediting must happen only
     * after independently verified payment confirmation.
     */
    async createFundingRequest(data) {
        if (!this.contractCode) {
            throw new Error(
                'MONNIFY_CONTRACT_CODE is required for funding requests.'
            );
        }

        if (!data || typeof data !== 'object') {
            throw new Error('Funding request data is required.');
        }

        const {
            amount,
            customerEmail,
            customerName,
            paymentReference,
            paymentDescription,
            redirectUrl
        } = data;

        const numericAmount = Number(amount);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            throw new Error(
                'Funding amount must be a positive number.'
            );
        }

        if (
            typeof customerEmail !== 'string' ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                customerEmail.trim()
            )
        ) {
            throw new Error(
                'A valid customer email is required.'
            );
        }

        if (
            typeof customerName !== 'string' ||
            !customerName.trim()
        ) {
            throw new Error(
                'Customer name is required.'
            );
        }

        if (
            typeof paymentReference !== 'string' ||
            !/^[A-Za-z0-9_-]{8,100}$/.test(
                paymentReference
            )
        ) {
            throw new Error(
                'A unique payment reference of 8–100 valid characters is required.'
            );
        }

        if (
            typeof paymentDescription !== 'string' ||
            !paymentDescription.trim()
        ) {
            throw new Error(
                'Payment description is required.'
            );
        }

        const payload = {
            amount: numericAmount,
            customerEmail: customerEmail.trim(),
            customerName: customerName.trim(),
            paymentReference,
            paymentDescription: paymentDescription.trim(),
            currencyCode: 'NGN',
            contractCode: this.contractCode
        };

        if (redirectUrl) {
            let parsedRedirect;

            try {
                parsedRedirect = new URL(redirectUrl);
            } catch {
                throw new Error(
                    'The funding redirect URL is invalid.'
                );
            }

            if (parsedRedirect.protocol !== 'https:') {
                throw new Error(
                    'The funding redirect URL must use HTTPS.'
                );
            }

            payload.redirectUrl = parsedRedirect.toString();
        }

        return this.request(
            '/api/v1/merchant/transactions/init-transaction',
            {
                method: 'POST',
                body: payload
            }
        );
    }

    /**
     * Verify a funding transaction by its payment reference.
     *
     * Do not treat an initiated transaction as a successful
     * payment. Check the returned provider status and amount.
     */
    async verifyFunding(paymentReference) {
        if (
            typeof paymentReference !== 'string' ||
            !/^[A-Za-z0-9_-]{8,100}$/.test(paymentReference)
        ) {
            throw new Error(
                'A valid payment reference is required.'
            );
        }

        const result = await this.request(
            '/api/v2/merchant/transactions/query?paymentReference=' +
                encodeURIComponent(paymentReference),
            { method: 'GET' }
        );

        return result;
    }

    /**
     * Check that the webhook signature matches the raw body.
     *
     * The request must preserve the original raw body bytes.
     */
    verifyWebhookSignature(rawBody, signature) {
        if (
            !this.secretKey ||
            !Buffer.isBuffer(rawBody) ||
            typeof signature !== 'string'
        ) {
            return false;
        }

        const expected = crypto
            .createHmac('sha512', this.secretKey)
            .update(rawBody)
            .digest('hex');

        const providedBuffer = Buffer.from(signature, 'utf8');
        const expectedBuffer = Buffer.from(expected, 'utf8');

        return (
            providedBuffer.length === expectedBuffer.length &&
            crypto.timingSafeEqual(
                providedBuffer,
                expectedBuffer
            )
        );
    }
}

module.exports = MonnifyFunding;
