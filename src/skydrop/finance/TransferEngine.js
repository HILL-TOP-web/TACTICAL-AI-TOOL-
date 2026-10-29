'use strict';

const crypto = require('node:crypto');
const mongoose = require('mongoose');

const Wallet = require('../../database/models/Wallet');
const Transaction = require('../../database/models/Transaction');

const walletRepository = require('../../repositories/WalletRepository');
const transactionRepository = require('../../repositories/TransactionRepository');
const ledgerService = require('../ledger/LedgerService');

const SUPPORTED_CURRENCIES = ['SKD', 'USD', 'NGN'];
const CURRENCY_SCALE = 8;

function createError(message, code, statusCode = 400) {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    return error;
}

function parseDecimalToUnits(value, scale = CURRENCY_SCALE) {
    const input = String(value ?? '').trim();

    if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(input)) {
        throw createError(
            'Amount must be a positive decimal number.',
            'INVALID_AMOUNT'
        );
    }

    const [whole, fraction = ''] = input.split('.');

    if (fraction.length > scale) {
        throw createError(
            `Amount supports at most ${scale} decimal places.`,
            'INVALID_AMOUNT_PRECISION'
        );
    }

    const factor = 10n ** BigInt(scale);

    const fractionalUnits = BigInt(
        fraction.padEnd(scale, '0') || '0'
    );

    return BigInt(whole) * factor + fractionalUnits;
}

function unitsToDecimal(units, scale = CURRENCY_SCALE) {
    const negative = units < 0n;
    const absolute = negative ? -units : units;
    const factor = 10n ** BigInt(scale);

    const whole = absolute / factor;

    const fraction = (absolute % factor)
        .toString()
        .padStart(scale, '0')
        .replace(/0+$/, '');

    return `${negative ? '-' : ''}${whole}${
        fraction ? `.${fraction}` : ''
    }`;
}

function decimalToUnits(value, scale = CURRENCY_SCALE) {
    return parseDecimalToUnits(value.toString(), scale);
}

class TransferEngine {
    async executeTransfer({
        senderUserId,
        recipientUserId,
        currency,
        amount,
        description = '',
        idempotencyKey = null
    }) {
        if (
            !mongoose.isValidObjectId(senderUserId) ||
            !mongoose.isValidObjectId(recipientUserId)
        ) {
            throw createError(
                'Valid sender and recipient IDs are required.',
                'INVALID_USER'
            );
        }

        if (senderUserId.toString() === recipientUserId.toString()) {
            throw createError(
                'You cannot transfer funds to yourself.',
                'SELF_TRANSFER'
            );
        }

        const normalizedCurrency = String(currency || '').toUpperCase();

        if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
            throw createError(
                'Unsupported transfer currency.',
                'UNSUPPORTED_CURRENCY'
            );
        }

        const amountUnits = parseDecimalToUnits(amount);

        if (amountUnits <= 0n) {
            throw createError(
                'Transfer amount must be greater than zero.',
                'INVALID_AMOUNT'
            );
        }

        const normalizedAmount = unitsToDecimal(amountUnits);

        if (
            idempotencyKey !== null &&
            (
                typeof idempotencyKey !== 'string' ||
                idempotencyKey.length < 8 ||
                idempotencyKey.length > 128 ||
                !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey)
            )
        ) {
            throw createError(
                'Invalid idempotency key.',
                'INVALID_IDEMPOTENCY_KEY'
            );
        }

        const session = await mongoose.startSession();

        let result;

        try {
            await session.withTransaction(async () => {
                if (idempotencyKey) {
                    const existing =
                        await transactionRepository.findByIdempotencyKey(
                            senderUserId,
                            idempotencyKey,
                            { session }
                        );

                    if (existing) {
                        const sameRequest =
                            existing.recipientUserId?.toString() ===
                                recipientUserId.toString() &&
                            existing.currency === normalizedCurrency &&
                            existing.amount.toString() === normalizedAmount;

                        if (!sameRequest) {
                            throw createError(
                                'This idempotency key was already used for a different request.',
                                'IDEMPOTENCY_CONFLICT',
                                409
                            );
                        }

                        if (existing.status !== 'completed') {
                            throw createError(
                                'The previous transfer is not completed.',
                                'TRANSFER_NOT_COMPLETED',
                                409
                            );
                        }

                        result = {
                            transaction: existing,
                            replayed: true
                        };

                        return;
                    }
                }

                const senderWallet =
                    await walletRepository.findByUserAndCurrency(
                        senderUserId,
                        normalizedCurrency,
                        { session }
                    );

                const recipientWallet =
                    await walletRepository.findByUserAndCurrency(
                        recipientUserId,
                        normalizedCurrency,
                        { session }
                    );

                if (!senderWallet) {
                    throw createError(
                        'Sender wallet not found.',
                        'SENDER_WALLET_NOT_FOUND',
                        404
                    );
                }

                if (!recipientWallet) {
                    throw createError(
                        'Recipient wallet not found.',
                        'RECIPIENT_WALLET_NOT_FOUND',
                        404
                    );
                }

                if (
                    senderWallet.status !== 'active' ||
                    recipientWallet.status !== 'active'
                ) {
                    throw createError(
                        'Both wallets must be active.',
                        'WALLET_NOT_ACTIVE',
                        409
                    );
                }

                if (
                    senderWallet._id.toString() ===
                    recipientWallet._id.toString()
                ) {
                    throw createError(
                        'Sender and recipient wallets must be different.',
                        'SAME_WALLET'
                    );
                }

                const senderBalanceUnits =
                    decimalToUnits(senderWallet.balance);

                if (senderBalanceUnits < amountUnits) {
                    throw createError(
                        'Insufficient wallet balance.',
                        'INSUFFICIENT_FUNDS',
                        409
                    );
                }

                const reference =
                    `SKD-${crypto.randomUUID()}`;

                const transaction = await transactionRepository.create(
                    {
                        reference,
                        idempotencyKey,
                        type: 'internal_transfer',
                        status: 'pending',
                        senderUserId,
                        recipientUserId,
                        senderWalletId: senderWallet._id,
                        recipientWalletId: recipientWallet._id,
                        currency: normalizedCurrency,
                        amount: normalizedAmount,
                        fee: '0',
                        description: String(description).slice(0, 500),
                        metadata: {
                            initiatedBy: senderUserId.toString()
                        }
                    },
                    { session }
                );

                await walletRepository.debit(
                    senderWallet._id,
                    normalizedAmount,
                    { session }
                );

                await walletRepository.credit(
                    recipientWallet._id,
                    normalizedAmount,
                    { session }
                );

                await ledgerService.recordTransfer(
                    {
                        transactionId: transaction._id,
                        senderWallet,
                        recipientWallet,
                        senderUserId,
                        recipientUserId,
                        currency: normalizedCurrency,
                        amount: normalizedAmount,
                        reference
                    },
                    { session }
                );

                transaction.status = 'completed';
                transaction.completedAt = new Date();

                await transaction.save({ session });

                const ledgerCheck =
                    await ledgerService.verifyTransfer(
                        transaction._id,
                        { session }
                    );

                if (!ledgerCheck.balanced) {
                    throw createError(
                        'Ledger verification failed.',
                        'LEDGER_VERIFICATION_FAILED',
                        500
                    );
                }

                result = {
                    transaction,
                    replayed: false
                };
            });
        } catch (error) {
            if (error.code === 11000 && idempotencyKey) {
                throw createError(
                    'A transfer with this idempotency key already exists. Retry using the original key and check transaction history.',
                    'IDEMPOTENCY_CONFLICT',
                    409
                );
            }

            throw error;
        } finally {
            await session.endSession();
        }

        return result;
    }

    async getWalletBalance(userId, currency) {
        const normalizedCurrency = String(currency || '').toUpperCase();

        if (
            !mongoose.isValidObjectId(userId) ||
            !SUPPORTED_CURRENCIES.includes(normalizedCurrency)
        ) {
            throw createError(
                'Valid user ID and currency are required.',
                'INVALID_WALLET_REQUEST'
            );
        }

        const wallet = await Wallet.findOne({
            userId,
            currency: normalizedCurrency
        }).exec();

        if (!wallet) {
            throw createError(
                'Wallet not found.',
                'WALLET_NOT_FOUND',
                404
            );
        }

        return {
            walletId: wallet._id,
            currency: wallet.currency,
            balance: wallet.balance.toString(),
            status: wallet.status
        };
    }

    async getTransaction(reference) {
        const transaction = await Transaction.findOne({
            reference
        }).exec();

        if (!transaction) {
            throw createError(
                'Transaction not found.',
                'TRANSACTION_NOT_FOUND',
                404
            );
        }

        return transaction;
    }
}

module.exports = new TransferEngine();
module.exports.TransferEngine = TransferEngine;
module.exports.parseDecimalToUnits = parseDecimalToUnits;
module.exports.unitsToDecimal = unitsToDecimal;
