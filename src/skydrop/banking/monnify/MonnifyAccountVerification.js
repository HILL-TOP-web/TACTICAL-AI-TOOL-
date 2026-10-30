'use strict';

const MonnifyAuth = require('./MonnifyAuth');

class MonnifyAccountVerification {

    constructor() {
        this.baseUrl = process.env.MONNIFY_BASE_URL;
    }

    async verifyAccount({
        accountNumber,
        bankCode
    }) {
        if (!/^\d{10}$/.test(String(accountNumber))) {
            throw new Error('Invalid account number.');
        }

        if (!bankCode) {
            throw new Error('Bank code is required.');
        }

        if (!this.baseUrl ||
            !/^https:\/\/api\.monnify\.com$/.test(this.baseUrl)) {
            throw new Error(
                'Invalid Monnify production configuration.'
            );
        }

        const token = await MonnifyAuth.getAccessToken();

        const url = new URL(
            '/api/v1/disbursements/account/validate',
            this.baseUrl
        );

        url.searchParams.set('accountNumber', accountNumber);
        url.searchParams.set('bankCode', bankCode);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            },
            signal: AbortSignal.timeout(15000)
        });

        const data = await response.json();

        if (!response.ok || data.requestSuccessful !== true) {
            throw new Error(
                data.responseMessage ||
                'Account verification failed.'
            );
        }

        return {
            verified: true,
            accountNumber,
            accountName:
                data.responseBody?.accountName || null,
            bankCode
        };
    }
}

module.exports = new MonnifyAccountVerification();
