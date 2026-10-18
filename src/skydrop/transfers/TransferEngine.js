'use strict';

const crypto = require('node:crypto');

const TransferValidator = require('./TransferValidator');

const {
    TransferStatus,
    isTerminalStatus
} = require('./TransferStatus');

class TransferEngine {
    constructor({
        transferRepository,
        walletService,
        payoutProvider,
        auditLogger
    }) {
        if (!transferRepository) {
            throw new Error('transferRepository is required.');
        }

        if (!walletService) {
            throw new Error('walletService is required.');
        }

        if (!payoutProvider) {
            throw new Error('payoutProvider is required.');
        }

        this.transferRepository = transferRepository;
        this.walletService = walletService;
        this.payoutProvider = payoutProvider;

        this.auditLogger = auditLogger || {
            info: () => {},
            error: () => {}
        };
    }

    async requestTransfer(request) {
        const validated = TransferValidator.validate(request);

        /*
         * The repository must enforce a UNIQUE constraint on
         * (userId, idempotencyKey).
         */
        const existing =
            await this.transferRepository.findByIdempotencyKey({
                userId: validated.userId,
                idempotencyKey: validated.idempotencyKey
            });

        if (existing) {
            return existing;
        }

        const reference = TransferValidator.createReference();

        /*
         * This operation must be atomic and persistent:
         *
         * 1. Verify spendable balance.
         * 2. Reserve funds.
         * 3. Create the transfer record.
         * 4. Prevent duplicate reservation.
         *
         * Never implement this as a simple read followed by
         * a separate debit without database transaction control.
         */
        const transfer = await this.transferRepository
            .createAndReserveFunds({
                ...validated,
                reference,
                status: TransferStatus.CREATED
            });

        try {
            await this.transferRepository.updateStatus({
                reference,
                status: TransferStatus.PENDING
            });

            const providerResult =
                await this.payoutProvider.disburse({
                    ...validated,
                    reference,
                    narration: `SkyDrop withdrawal ${reference}`
                });

            /*
             * A provider response is not final proof of payment.
             * Keep the transfer pending until independently verified.
             */
            const result = await this.transferRepository
                .recordProviderSubmission({
                    reference,
                    providerReference:
                        providerResult.providerReference || reference,
                    providerStatus: providerResult.providerStatus,
                    status: TransferStatus.PENDING
                });

            await this.auditLogger.info({
                event: 'transfer_submitted',
                reference,
                userId: validated.userId
            });

            return result || {
                ...transfer,
                reference,
                status: TransferStatus.PENDING
            };
        } catch (error) {
            /*
             * A network timeout can occur after the provider
             * has accepted a payout. Do not blindly release funds.
             * The repository should mark the submission uncertain
             * and require status reconciliation before deciding
             * whether funds should be released.
             */
            await this.transferRepository
                .markSubmissionUncertain({
                    reference,
                    reason: 'PROVIDER_SUBMISSION_UNCERTAIN'
                });

            await this.auditLogger.error({
                event: 'transfer_submission_uncertain',
                reference,
                message: error.message
            });

            throw error;
        }
    }

    async applyVerifiedStatus({
        reference,
        status,
        providerReference,
        verifiedBy
    }) {
        if (!reference) {
            throw new Error('Transfer reference is required.');
        }

        if (!Object.values(TransferStatus).includes(status)) {
            throw new Error('Invalid internal transfer status.');
        }

        /*
         * Call this method only after verifying the status through
         * a trusted provider-status check or verified webhook.
         */
        return this.transferRepository.applyVerifiedStatus({
            reference,
            status,
            providerReference,
            verifiedBy,
            terminal: isTerminalStatus(status)
        });
    }

    createIdempotencyKey() {
        return crypto.randomUUID();
    }
}

module.exports = TransferEngine;
