'use strict';

const WithdrawalValidator = require('./WithdrawalValidator');
const WithdrawalStatus = require('./WithdrawalStatus');

class WithdrawalEngine {
    constructor({
        walletService,
        withdrawalRepository,
        gateway
    } = {}) {
        if (!walletService) {
            throw new Error('A wallet service is required.');
        }

        if (!withdrawalRepository) {
            throw new Error(
                'A persistent withdrawal repository is required.'
            );
        }

        if (!gateway) {
            throw new Error('A withdrawal gateway is required.');
        }

        this.walletService = walletService;
        this.withdrawalRepository = withdrawalRepository;
        this.gateway = gateway;
    }

    async requestWithdrawal(request) {
        const validatedRequest =
            WithdrawalValidator.validate(request);

        if (
            typeof this.withdrawalRepository.findByIdempotencyKey !==
                'function' ||
            typeof this.withdrawalRepository.create !== 'function' ||
            typeof this.withdrawalRepository.updateStatus !==
                'function'
        ) {
            throw new Error(
                'The withdrawal repository does not implement the required methods.'
            );
        }

        const existing =
            await this.withdrawalRepository.findByIdempotencyKey(
                validatedRequest.idempotencyKey
            );

        if (existing) {
            if (existing.userId !== validatedRequest.userId) {
                throw new Error(
                    'The idempotency key is already associated with another user.'
                );
            }

            return existing;
        }

        if (
            typeof this.walletService.reserveFunds !== 'function'
        ) {
            throw new Error(
                'The wallet service must implement atomic fund reservation.'
            );
        }

        if (
            typeof this.walletService.releaseReservedFunds !==
            'function'
        ) {
            throw new Error(
                'The wallet service must implement fund release.'
            );
        }

        // The wallet service must atomically reserve funds and prevent
        // concurrent withdrawals from spending the same balance.
        const reservation =
            await this.walletService.reserveFunds({
                userId: validatedRequest.userId,
                amount: validatedRequest.amount,
                currency: validatedRequest.currency,
                reference: validatedRequest.idempotencyKey
            });

        if (!reservation || reservation.success !== true) {
            throw new Error(
                'Insufficient available balance or fund reservation failed.'
            );
        }

        let withdrawal;

        try {
            withdrawal = await this.withdrawalRepository.create({
                ...validatedRequest,
                status: WithdrawalStatus.PENDING,
                reservationReference:
                    reservation.reference ||
                    validatedRequest.idempotencyKey,
                providerReference: null,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            await this.walletService.releaseReservedFunds({
                userId: validatedRequest.userId,
                reference:
                    reservation.reference ||
                    validatedRequest.idempotencyKey
            });

            throw error;
        }

        try {
            const result = await this.gateway.initiateWithdrawal({
                ...validatedRequest,
                reference: withdrawal.reference
            });

            // A submission is not proof of payment.
            // Only a provider-confirmed terminal status can complete it.
            if (result.status === WithdrawalStatus.SUCCESSFUL) {
                return await this.withdrawalRepository.updateStatus(
                    withdrawal.reference,
                    WithdrawalStatus.SUCCESSFUL,
                    {
                        providerReference: result.providerReference
                    }
                );
            }

            if (result.status === WithdrawalStatus.FAILED) {
                const failed =
                    await this.withdrawalRepository.updateStatus(
                        withdrawal.reference,
                        WithdrawalStatus.FAILED,
                        {
                            providerReference: result.providerReference
                        }
                    );

                await this.walletService.releaseReservedFunds({
                    userId: validatedRequest.userId,
                    reference:
                        reservation.reference ||
                        validatedRequest.idempotencyKey
                });

                return failed;
            }

            return await this.withdrawalRepository.updateStatus(
                withdrawal.reference,
                WithdrawalStatus.PROCESSING,
                {
                    providerReference: result.providerReference || null
                }
            );
        } catch (error) {
            // A timeout or network error does not prove that the
            // provider rejected the transfer.
            // Keep the funds reserved until reconciliation establishes
            // the authoritative outcome.
            await this.withdrawalRepository.updateStatus(
                withdrawal.reference,
                WithdrawalStatus.PENDING,
                {
                    errorCode: 'PROVIDER_OUTCOME_UNKNOWN'
                }
            );

            throw new Error(
                'Withdrawal outcome is pending verification. ' +
                'Do not submit a duplicate withdrawal. Reconcile the existing reference.'
            );
        }
    }
}

module.exports = WithdrawalEngine;
