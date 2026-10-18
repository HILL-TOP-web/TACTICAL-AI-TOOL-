'use strict';

const { getMonnifyConfig } = require('./MonnifyConfig');

const MonnifyAuth = require('./MonnifyAuth');

const BankAccounts = require('../BankAccounts');

class MonnifyDisbursement {
    constructor({
        auth = new MonnifyAuth(),
        fetchImpl = globalThis.fetch
    } = {}) {
        if (typeof fetchImpl !== 'function') {
            throw new Error('Fetch API is required.');
        }

        this.auth = auth;
        this.fetch = fetchImpl;
    }

    async disburse({
        userId,
        reference,
        amountKobo,
        currency = 'NGN',
        destinationBankCode,
        destinationAccountNumber,
        narration
    }) {
        if (
            typeof userId !== 'string' ||
            !userId.trim()
        ) {
            throw new Error('User ID is required.');
        }

        if (
            typeof reference !== 'string' ||
            !reference.trim()
        ) {
            throw new Error('Transfer reference is required.');
        }

        if (
            !Number.isSafeInteger(amountKobo) ||
            amountKobo <= 0
        ) {
            throw new Error(
                'Amount must be a positive integer in kobo.'
            );
        }

        if (currency !== 'NGN') {
            throw new Error(
                'Monnify payout currency must be NGN.'
            );
        }

        const destination = BankAccounts.validateDestination({
            bankCode: destinationBankCode,
            accountNumber: destinationAccountNumber
        });

        const config = getMonnifyConfig();

        const token = await this.auth.getAccessToken();

        /*
         * This payload must match the currently approved
         * Monnify single-disbursement API contract.
         *
         * Confirm whether the API requires a source account
         * number or another funding-account field for your
         * particular account configuration.
         */
        const payload = {
            amount: amountKobo / 100,

            reference,

            narration:
                narration || `SkyDrop transfer ${reference}`,

            destinationBankCode: destination.bankCode,

            destinationAccountNumber:
                destination.accountNumber,

            currency: 'NGN'
        };

        const response = await this.fetch(
            `${config.baseUrl}${config.disbursementPath}`,
            {
                method: 'POST',

                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(payload),

                signal: AbortSignal.timeout(config.timeoutMs)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            const error = new Error(
                'Monnify did not accept the disbursement request.'
            );

            error.code = 'MONNIFY_DISBURSEMENT_REJECTED';

            error.httpStatus = response.status;

            /*
             * Do not expose provider secrets or full sensitive
             * response details to the frontend.
             */
            throw error;
        }

        if (result.requestSuccessful !== true) {
            const error = new Error(
                'Monnify reported that the disbursement request failed.'
            );

            error.code = 'MONNIFY_DISBURSEMENT_NOT_ACCEPTED';

            throw error;
        }

        /*
         * IMPORTANT:
         * API acceptance is not final settlement.
         * SkyDrop must independently verify the final status.
         */
        return {
            provider: 'monnify',

            providerReference:
                result.responseBody?.reference || reference,

            providerStatus:
                result.responseBody?.status || 'PENDING',

            accepted: true,

            finalSettlementConfirmed: false,

            skyDropReference: reference
        };
    }
}

module.exports = MonnifyDisbursement;
