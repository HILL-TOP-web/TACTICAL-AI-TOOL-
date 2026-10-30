'use strict';

const MonnifyAuth = require('./MonnifyAuth');

const Withdrawal = require('../../models/Withdrawal');
const Transaction = require('../../models/Transaction');

class MonnifyReconciliationService {

    constructor() {
        this.baseUrl = process.env.MONNIFY_BASE_URL;
    }

    async getProviderStatus(reference) {

        const token = await MonnifyAuth.getAccessToken();

        const url = new URL(
            '/api/v2/disbursements/single/summary',
            this.baseUrl
        );

        url.searchParams.set('reference', reference);

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            signal: AbortSignal.timeout(15000)
        });

        const data = await response.json();

        if (!response.ok ||
            data.requestSuccessful !== true) {
            throw new Error(
                'Unable to retrieve authoritative Monnify status.'
            );
        }

        return data.responseBody;
    }

    async reconcileWithdrawal(reference) {

        const withdrawal = await Withdrawal.findOne({
            providerReference: reference
        });

        if (!withdrawal) {
            throw new Error('Withdrawal not found.');
        }

        const provider = await this.getProviderStatus(reference);

        const status = String(
            provider.status || ''
        ).toUpperCase();

        const mapping = {
            SUCCESS: 'SUCCESSFUL',
            COMPLETED: 'SUCCESSFUL',
            FAILED: 'FAILED',
            PENDING: 'PENDING'
        };

        const newStatus = mapping[status];

        if (!newStatus) {
            return {
                reconciled: false,
                reason: 'Unknown provider status'
            };
        }

        if (withdrawal.status === 'SUCCESSFUL' &&
            newStatus !== 'SUCCESSFUL') {
            return {
                reconciled: false,
                reason: 'Conflicting terminal status'
            };
        }

        withdrawal.status = newStatus;

        await withdrawal.save();

        await Transaction.findOneAndUpdate(
            { reference },
            { $set: { status: newStatus } }
        );

        return {
            reconciled: true,
            reference,
            status: newStatus
        };
    }
}

module.exports = new MonnifyReconciliationService();
