'use strict';

const crypto = require('crypto');

const { mongoose } = require('../../database/mongoose');

const Wallet = require('../../database/models/Wallet');
const Transaction = require('../../database/models/Transaction');
const Transfer = require('../../database/models/Transfer');

const walletRepository = require('../../repositories/WalletRepository');
const ledger = require('../ledger/LedgerService');
const monnify = require('../monnify/MonnifyDisbursementGateway');

const { HttpError } = require('../../api/utils/httpError');

function newReference() {
    return `TRF-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`;
}

async function execute({
    userId,
    amount,
    accountNumber,
    bankCode,
    recipientName,
    narration = ''
}) {
    if (process.env.SKYDROP_TRANSFERS_ENABLED !== 'true') {
        throw new HttpError(503, 'transfers-disabled');
    }

    if (process.env.MONNIFY_ENABLED !== 'true') {
        throw new HttpError(503, 'monnify-disabled');
    }

    if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !/^\d{10}$/.test(String(accountNumber || '')) ||
        !/^[A-Za-z0-9_-]{2,20}$/.test(String(bankCode || '')) ||
        !String(recipientName || '').trim()
    ) {
        throw new HttpError(400, 'invalid-transfer-details');
    }

    if (!mongoose.isValidObjectId(userId)) {
        throw new HttpError(401, 'invalid-user-id');
    }

    const reference = newReference();
    const session = await mongoose.startSession();

    let transferId;

    try {
        await session.withTransaction(async () => {
            const wallet = await walletRepository.getByUserId(
                userId,
                session
            );

            const balance = Number(wallet.availableBalance || 0);

            if (balance < amount) {
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
                    type: 'transfer',
                    amount,
                    currency: 'NGN',
                    direction: 'debit',
                    status: 'processing',
                    description: String(narration).slice(0, 200),
                    metadata: {
                        operation: 'bank-disbursement'
                    }
                }],
                { session }
            );

            const [transfer] = await Transfer.create(
                [{
                    userId,
                    walletId: wallet._id,
                    transactionId: transaction._id,
                    reference,
                    recipientName: String(recipientName).trim(),
                    recipientAccountNumber: String(accountNumber),
                    recipientBankCode: String(bankCode),
                    amount,
                    currency: 'NGN',
                    narration: String(narration).slice(0, 200),
                    status: 'processing'
                }],
                { session }
            );

            transferId = transfer._id;

            await ledger.record({
                userId,
                walletId: wallet._id,
                transactionId: transaction._id,
                reference,
                currency: 'NGN',
                amount,
                direction: 'debit',
                balanceAfter: Number(refreshed.availableBalance),
                description: 'Bank transfer reserved',
                session
            });
        });
    } finally {
        await session.endSession();
    }

    // The provider request happens after the wallet reservation
    // commits. An uncertain response must be reconciled rather
    // than automatically refunding funds.
    try {
        const transfer = await Transfer.findById(transferId)
            .select('+recipientAccountNumber +recipientBankCode');

        const providerResult = await monnify.initiate({
            reference,
            amount,
            accountNumber: transfer.recipientAccountNumber,
            bankCode: transfer.recipientBankCode,
            accountName: transfer.recipientName,
            narration: transfer.narration || `SkyDrop ${reference}`
        });

        transfer.providerReference =
            providerResult.reference ||
            providerResult.transactionReference ||
            reference;

        transfer.status = 'processing';

        await transfer.save();

        await Transaction.updateOne(
            { reference, userId },
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
        await Transfer.updateOne(
            { _id: transferId },
            {
                $set: {
                    status: 'reconciliation_required'
                }
            }
        );

        await Transaction.updateOne(
            { reference, userId },
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

module.exports = {
    execute
};
