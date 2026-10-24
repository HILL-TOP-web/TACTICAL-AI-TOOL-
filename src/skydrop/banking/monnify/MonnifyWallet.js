'use strict';

const MonnifyFunding = require('./MonnifyFunding');

class MonnifyWallet {
    constructor(options = {}) {
        this.client = options.client || new MonnifyFunding(options);

        this.walletAccountNumber =
            options.walletAccountNumber ||
            process.env.MONNIFY_WALLET_ACCOUNT_NUMBER ||
            '';
    }

    /**
     * Validate the configuration needed for a wallet balance query.
     */
    validateWalletConfiguration() {
        if (
            typeof this.walletAccountNumber !== 'string' ||
            !/^\d{10}$/.test(this.walletAccountNumber)
        ) {
            throw new Error(
                'MONNIFY_WALLET_ACCOUNT_NUMBER must contain exactly 10 digits.'
            );
        }
    }

    /**
     * Check Monnify connectivity and authentication.
     */
    async checkConnection() {
        return this.client.checkConnection();
    }

    /**
     * Retrieve the merchant disbursement wallet balance.
     *
     * This endpoint is for the configured Monnify wallet.
     * It is not an individual SkyDrop user's balance.
     */
    async getBalance() {
        this.validateWalletConfiguration();

        const result = await this.client.request(
            '/api/v2/disbursements/wallet-balance?accountNumber=' +
                encodeURIComponent(this.walletAccountNumber),
            { method: 'GET' }
        );

        if (
            result.requestSuccessful !== true ||
            !result.responseBody
        ) {
            throw new Error(
                'Monnify wallet balance could not be verified.'
            );
        }

        return result;
    }

    /**
     * Return a non-sensitive configuration health report.
     *
     * Never include account numbers or credentials in logs
     * or public API responses.
     */
    getConfigurationStatus() {
        return {
            provider: 'Monnify',
            baseUrlConfigured: Boolean(this.client.baseUrl),
            apiKeyConfigured: Boolean(this.client.apiKey),
            secretKeyConfigured: Boolean(this.client.secretKey),
            walletAccountNumberConfigured:
                /^\d{10}$/.test(this.walletAccountNumber)
        };
    }
}

module.exports = MonnifyWallet;
