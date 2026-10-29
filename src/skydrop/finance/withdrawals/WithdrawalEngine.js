'use strict';

const crypto = require('crypto');

const { mongoose } = require('../../database/mongoose');

const Wallet = require('../../database/models/Wallet');
const Withdrawal = require('../../database/models/Withdrawal');
const Transaction = require('../../database/models/Transaction');

const walletRepository = require('../../repositories/WalletRepository');
const ledger = require('../ledger/LedgerService');
const monnify = require('../monnify/MonnifyDisbursementGateway');

const { HttpError } = require('../../api/utils/httpError');

const MIN_WITHDRAWAL = Number(
    process.env.SKYDROP_MIN_WITHDRAWAL_NGN || 100
);

function newReference() {
    return `WDR-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`;
}

async function request({
    userId,
    amount,
    accountNumber,
    bankCode,
    accountName
}) {
    if (
        process.env.SKYDROP_WITHDRAWALS_ENABLED !== 'true' ||
        process.env.SKYDROP_MONNIFY_WITHDRAWALS_ENABLED !== 'true'
    ) {
        throw new HttpError(503, 'withdrawals-disabled');
    }

    if (process.env.MONNIFY_ENABLED !== 'true') {
        throw new HttpError(503, 'monnify-disabled');
    }

    if (
        !Number.isFinite(amount) ||
        amount < MIN_WITHDRAWAL ||
        !/^\d{10}$/.test(String(accountNumber || '')) ||
        !/^[A-Za-z0-9_-]{2,20}$/.test(String(bankCode || '')) ||
        !String(accountName || '').trim()
    ) {
        throw new HttpError(400, 'invalid-withdrawal-details');
    }

    if (!mongoose.isValidObjectId(userId)) {
        throw new HttpError(401, 'invalid-user-id');
    }

    const reference = newReference();
    const session = await mongoose.startSession();

    let withdrawalId;

    try {
        await session.withTransaction(async () => {
            const wallet = await walletRepository.getByUserId(
                userId,
                session
            );

            if (wallet.status !== 'active') {
                throw new HttpError(403, 'wallet-not-active');
            }

            if (Number(wallet.availableBalance || 0) < amount) {
                throw new HttpError(400, 'insufficient-funds');
            }

            const updated = await Wallet.updateOne(
                {
                    _id: wallet._id,
                    availableBalance: { $gte: amount },
                    status: 'active'
                },
                {
                    $inc: {
                        availableBalance: -amount,
                        pendingBalance: amount
                    }
                },
                { session }
            );

            if (updated.modifiedCount !== 1) {
                throw new HttpError(
                    409,
                    'wallet-balance-changed'
                );
            }

            const refreshed = await Wallet.findById(wallet._id)
                .session(session);

            const [transaction] = await Transaction.create(
                [{
                    userId,
                    walletId: wallet._id,
                    reference,
                    type: 'withdrawal',
                    status: 'processing',
                    amount,
                    currency: 'NGN',
                    direction: 'debit',
                    description: 'SkyDrop bank withdrawal',
                    metadata: {
                        provider: 'monnify'
                    }
                }],
                { session }
            );

            const [withdrawal] = await Withdrawal.create(
                [{
                    userId,
                    walletId: wallet._id,
                    transactionId: transaction._id,
                    reference,
                    recipientName: String(accountName).trim(),
                    recipientAccountNumber: String(accountNumber),
                    amount,
                    currency: 'NGN',
                    provider: 'monnify',
                    status: 'processing'
                }],
                { session }
            );

            withdrawalId = withdrawal._id;

            await ledger.record({
                userId,
                walletId: wallet._id,
                transactionId: transaction._id,
                reference,
                currency: 'NGN',
                amount,
                direction: 'debit',
                balanceAfter: Number(refreshed.availableBalance),
                description: 'Withdrawal amount reserved',
                session
            });
        });
    } finally {
        await session.endSession();
    }

    try {
        const withdrawal = await Withdrawal.findById(withdrawalId)
            .select('+recipientAccountNumber');

        const providerResult = await monnify.initiate({
            reference,
            amount,
            accountNumber: withdrawal.recipientAccountNumber,
            bankCode: withdrawal.bankCode,
            accountName: withdrawal.recipientName,
            narration: `SkyDrop withdrawal ${reference}`
        });

        withdrawal.providerReference =
            providerResult.reference ||
            providerResult.transactionReference ||
            reference;

        withdrawal.status = 'processing';

        await withdrawal.save();

        await Transaction.updateOne(
            { userId, reference },
            {
                $set: {
                    status: 'processing',
                    metadata: {
                        provider: 'monnify',
                        providerStatus: providerResult.status || 'PENDING'
                    }
                }
            }
        );

        return {
            reference,
            status: 'processing'
        };
    } catch (error) {
        await Withdrawal.updateOne(
            { _id: withdrawalId },
            {
                $set: {
                    status: 'reconciliation_required',
                    failureReason: 'provider-outcome-unconfirmed'
                }
            }
        );

        await Transaction.updateOne(
            { userId, reference },
            {
                $set: {
                    status: 'processing',
                    metadata: {
                        provider: 'monnify',
                        reconciliationRequired: true
                    }
                }
            }
        );

        return {
            reference,
            status: 'reconciliation_required'
        };
    }
}

async function reconcileOne(withdrawal) {
    const provider = await monnify.status(
        withdrawal.providerReference || withdrawal.reference
    );

    const status = String(
        provider.status || provider.transactionStatus || ''
    ).toUpperCase();

    const succeeded = [
        'SUCCESS',
        'SUCCESSFUL',
        'COMPLETED'
    ].includes(status);

    const failed = [
        'FAILED',
        'REVERSED',
        'CANCELLED'
    ].includes(status);

    if (!succeeded && !failed) {
        await Withdrawal.updateOne(
            { _id: withdrawal._id },
            {
                $set: {
                    reconciliationCheckedAt: new Date()
                }
            }
        );

        return {
            reference: withdrawal.reference,
            status: 'processing'
        };
    }

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const current = await Withdrawal.findOne({
                _id: withdrawal._id
            }).session(session);

            if (
                !current ||
                ['successful', 'failed'].includes(current.status)
            ) {
                return;
            }

            const wallet = await Wallet.findOne({
                userId: current.userId
            }).session(session);

            if (!wallet) {
                throw new Error('withdrawal-wallet-not-found');
            }

            if (succeeded) {
                const updated = await Wallet.updateOne(
                    {
                        _id: wallet._id,
                        pendingBalance: { $gte: current.amount }
                    },
                    {
                        $inc: {
                            pendingBalance: -current.amount
                        }
                    },
                    { session }
                );

                if (updated.modifiedCount !== 1) {
                    throw new Error('withdrawal-pending-balance-mismatch');
                }

                current.status = 'successful';
            } else {
                const updated = await Wallet.updateOne(
                    {
                        _id: wallet._id,
                        pendingBalance: { $gte: current.amount }
                    },
                    {
                        $inc: {
                            pendingBalance: -current.amount,
                            availableBalance: current.amount
                        }
                    },
                    { session }
                );

                if (updated.modifiedCount !== 1) {
                    throw new Error('withdrawal-refund-balance-mismatch');
                }

                current.status = 'failed';
                current.failureReason = 'provider-confirmed-failure';
            }

            current.reconciliationCheckedAt = new Date();

            await current.save({ session });

            await Transaction.updateOne(
                {
                    userId: current.userId,
                    reference: current.reference
                },
                {
                    $set: {
                        status: succeeded ? 'successful' : 'failed',
                        metadata: {
                            provider: 'monnify',
                            providerStatus: status
                        }
                    }
                },
                { session }
            );
        });
    } finally {
        await session.endSession();
    }

    return {
        reference: withdrawal.reference,
        status: succeeded ? 'successful' : 'failed'
    };
}

async function reconcilePending({ limit = 100 } = {}) {
    const pending = await Withdrawal.find({
        status: {
            $in: [
                'processing',
                'reconciliation_required'
            ]
        }
    })
        .sort({ updatedAt: 1 })
        .limit(limit);

    const results = [];

    for (const withdrawal of pending) {
        try {
            results.push(await reconcileOne(withdrawal));
        } catch (error) {
            results.push({
                reference: withdrawal.reference,
                status: 'reconciliation_required'
            });
        }
    }

    return results;
}

module.exports = {
    request,
    reconcilePending
};
