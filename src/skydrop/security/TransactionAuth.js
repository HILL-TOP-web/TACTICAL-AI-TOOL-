'use strict';

const {
    requireUserIdentity,
    requirePermission,
    requireOwnership,
    PERMISSIONS
} = require('./Authorization');

class TransactionAuthError extends Error {
    constructor(message, code = 'TRANSACTION_AUTH_FAILED') {
        super(message);
        this.name = 'TransactionAuthError';
        this.code = code;
        this.statusCode = 403;
    }
}

class TransactionAuth {
    constructor(options = {}) {
        this.getUser = options.getUser || null;

        this.additionalVerification =
            options.additionalVerification || null;

        this.highRiskThreshold =
            Number.isFinite(options.highRiskThreshold) &&
            options.highRiskThreshold > 0
                ? options.highRiskThreshold
                : 100000;
    }

    async checkMonnifyEnvironment() {
        const requiredVariables = [
            'MONNIFY_BASE_URL',
            'MONNIFY_API_KEY',
            'MONNIFY_SECRET_KEY',
            'MONNIFY_CONTRACT_CODE'
        ];

        const missingVariables = requiredVariables.filter((name) => {
            return (
                typeof process.env[name] !== 'string' ||
                process.env[name].trim() === ''
            );
        });

        return {
            configured: missingVariables.length === 0,
            missingVariables
        };
    }

    async authorizeTransaction({
        user,
        transaction,
        permission = PERMISSIONS.TRANSACTION_CREATE,
        requireConfirmation = true
    }) {
        requireUserIdentity(user);
        requirePermission(user, permission);

        if (!transaction || typeof transaction !== 'object') {
            throw new TransactionAuthError(
                'A transaction is required.'
            );
        }

        if (
            typeof transaction.reference !== 'string' ||
            !transaction.reference.trim()
        ) {
            throw new TransactionAuthError(
                'A valid transaction reference is required.'
            );
        }

        if (
            typeof transaction.userId !== 'string' ||
            transaction.userId !== user.id
        ) {
            throw new TransactionAuthError(
                'The transaction does not belong to this user.',
                'TRANSACTION_OWNERSHIP_FAILED'
            );
        }

        requireOwnership(user, transaction);

        if (
            typeof transaction.amount !== 'number' ||
            !Number.isFinite(transaction.amount) ||
            transaction.amount <= 0
        ) {
            throw new TransactionAuthError(
                'The transaction amount is invalid.'
            );
        }

        if (requireConfirmation && transaction.confirmed !== true) {
            throw new TransactionAuthError(
                'Explicit transaction confirmation is required.',
                'TRANSACTION_CONFIRMATION_REQUIRED'
            );
        }

        if (
            transaction.provider &&
            String(transaction.provider).toLowerCase() === 'monnify'
        ) {
            const environment =
                await this.checkMonnifyEnvironment();

            if (!environment.configured) {
                const error = new TransactionAuthError(
                    'Monnify configuration is incomplete. ' +
                    'Check the backend .env configuration.',
                    'MONNIFY_ENV_INVALID'
                );

                error.missingVariables =
                    environment.missingVariables;

                throw error;
            }
        }

        if (transaction.amount >= this.highRiskThreshold) {
            if (!this.additionalVerification) {
                throw new TransactionAuthError(
                    'Additional verification is required for this transaction.',
                    'ADDITIONAL_VERIFICATION_REQUIRED'
                );
            }

            const verified = await this.additionalVerification({
                userId: user.id,
                transactionReference: transaction.reference,
                amount: transaction.amount,
                currency: transaction.currency
            });

            if (verified !== true) {
                throw new TransactionAuthError(
                    'Additional transaction verification failed.',
                    'ADDITIONAL_VERIFICATION_FAILED'
                );
            }
        }

        return {
            authorized: true,
            userId: user.id,
            transactionReference: transaction.reference
        };
    }

    async authorizeWithdrawal({ user, withdrawal }) {
        return this.authorizeTransaction({
            user,
            transaction: withdrawal,
            permission: PERMISSIONS.WITHDRAWAL_CREATE,
            requireConfirmation: true
        });
    }

    async authorizeTransfer({ user, transfer }) {
        return this.authorizeTransaction({
            user,
            transaction: transfer,
            permission: PERMISSIONS.TRANSFER_CREATE,
            requireConfirmation: true
        });
    }
}

module.exports = TransactionAuth;
