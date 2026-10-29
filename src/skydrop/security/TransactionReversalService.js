'use strict';

const crypto = require('node:crypto');

const {
    assertOperationAllowed
} = require('../security/TransactionValidator');

class TransactionReversalError extends Error {
    constructor(message, code = 'TRANSACTION_REVERSAL_FAILED') {
        super(message);

        this.name = 'TransactionReversalError';
        this.code = code;
        this.statusCode = 400;
    }
}

class TransactionReversalService {
    constructor({
        transactionRepository,
        ledgerService,
        auditTrail,
        transactionAuth = null
    }) {
        if (
            !transactionRepository ||
            typeof transactionRepository.findByReference !== 'function'
        ) {
            throw new TypeError(
                'TransactionReversalService requires TransactionRepository.findByReference().'
            );
        }

        if (
            !transactionRepository.createReversal ||
            typeof transactionRepository.createReversal !== 'function'
        ) {
            throw new TypeError(
                'TransactionRepository must implement createReversal().'
            );
        }

        if (
            !ledgerService ||
            typeof ledgerService.reverseTransaction !== 'function'
        ) {
            throw new TypeError(
                'LedgerService must implement reverseTransaction().'
            );
        }

        this.transactionRepository = transactionRepository;
        this.ledgerService = ledgerService;
        this.auditTrail = auditTrail;
        this.transactionAuth = transactionAuth;
    }

    async reverse({
        actorId,
        transactionReference,
        reason,
        authorization = null,
        session = null
    }) {
        if (!actorId || !transactionReference) {
            throw new TransactionReversalError(
                'The acting user and transaction reference are required.',
                'REVERSAL_INPUT_REQUIRED'
            );
        }

        if (
            typeof reason !== 'string' ||
            reason.trim().length < 5 ||
            reason.trim().length > 500
        ) {
            throw new TransactionReversalError(
                'A reversal reason between 5 and 500 characters is required.',
                'INVALID_REVERSAL_REASON'
            );
        }

        const transaction =
            await this.transactionRepository.findByReference(
                transactionReference,
                { session }
            );

        if (!transaction) {
            throw new TransactionReversalError(
                'The original transaction could not be found.',
                'TRANSACTION_NOT_FOUND'
            );
        }

        /*
         * A reversal requires explicit authorization.
         * The actor must be authorized by the application's
         * financial permissions policy.
         *
         * Ownership of the original transaction does not, by itself,
         * grant permission to reverse a completed financial operation.
         */
        if (!authorization || authorization.authorized !== true) {
            throw new TransactionReversalError(
                'Additional authorization is required.',
                'REVERSAL_AUTHORIZATION_REQUIRED'
            );
        }

        if (
            String(authorization.userId) !== String(actorId) ||
            authorization.operation !== 'transaction_reversal'
        ) {
            throw new TransactionReversalError(
                'The authorization does not match this operation.',
                'REVERSAL_AUTHORIZATION_MISMATCH'
            );
        }

        if (this.transactionAuth) {
            if (
                authorization.authorizationId === undefined ||
                authorization.authorizationId === null
            ) {
                throw new TransactionReversalError(
                    'A verifiable authorization record is required.',
                    'REVERSAL_AUTHORIZATION_UNVERIFIED'
                );
            }

            /*
             * The caller must obtain this verified authorization
             * from the application's authorization service.
             * Do not accept authorization flags from a client request.
             */
        }

        assertOperationAllowed({
            operation: 'reverse',
            transactionStatus: transaction.status,
            actorId,
            ownerId: transaction.userId
        });

        const reversalReference = `REV-${crypto
            .randomUUID()
            .replace(/-/g, '')
            .toUpperCase()}`;

        /*
         * Required repository contract:
         *
         * createReversal({
         *   originalTransaction,
         *   reversalReference,
         *   actorId,
         *   reason,
         *   session
         * })
         *
         * It must enforce uniqueness of reversalReference and
         * prevent more than one effective reversal per original
         * transaction.
         */
        const reversal =
            await this.transactionRepository.createReversal({
                originalTransaction: transaction,
                reversalReference,
                actorId: String(actorId),
                reason: reason.trim(),
                session
            });

        /*
         * Required ledger contract:
         *
         * reverseTransaction({
         *   originalTransaction,
         *   reversalTransaction: reversal,
         *   reference: reversalReference,
         *   reason,
         *   session
         * })
         *
         * It must create compensating entries, not delete
         * or rewrite the original ledger entries.
         */
        await this.ledgerService.reverseTransaction({
            originalTransaction: transaction,
            reversalTransaction: reversal,
            reference: reversalReference,
            reason: reason.trim(),
            session
        });

        if (this.auditTrail) {
            await this.auditTrail.record({
                actorId: String(actorId),
                action: 'transaction.reversed',
                resourceType: 'transaction',
                resourceId: String(transaction._id),
                transactionReference: reversalReference,
                outcome: 'success',
                details: {
                    originalReference: transaction.reference,
                    reversalReference,
                    reason: reason.trim()
                },
                session
            });
        }

        return {
            success: true,
            originalReference: transaction.reference,
            reversalReference,
            status: 'reversed'
        };
    }
}

module.exports = {
    TransactionReversalService,
    TransactionReversalError
};
