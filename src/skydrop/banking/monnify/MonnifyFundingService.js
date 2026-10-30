'use strict';

const mongoose = require('mongoose');

const Deposit = require('../../models/Deposit');
const Wallet = require('../../models/Wallet');
const Transaction = require('../../models/Transaction');
const LedgerEntry = require('../../models/LedgerEntry');

class MonnifyFundingService {

    async confirmFunding({
        userId,
        paymentReference,
        amount,
        currency = 'NGN'
    }) {
        const session = await mongoose.startSession();

        try {
            if (!userId || !paymentReference) {
                throw new Error(
                    'User and payment reference are required.'
                );
            }

            if (!Number.isSafeInteger(amount) || amount <= 0) {
                throw new Error('Invalid deposit amount.');
            }

            if (currency !== 'NGN') {
                throw new Error('Unsupported deposit currency.');
            }

            let result;

            await session.withTransaction(async () => {

                const deposit = await Deposit.findOne({
                    paymentReference
                }).session(session);

                if (!deposit) {
                    throw new Error('Deposit record not found.');
                }

                if (String(deposit.userId) !== String(userId)) {
                    throw new Error('Deposit ownership mismatch.');
                }

                if (deposit.status === 'SUCCESSFUL') {
                    result = deposit;
                    return;
                }

                if (deposit.status !== 'PENDING') {
                    throw new Error(
                        'Deposit cannot be credited in its current state.'
                    );
                }

                if (deposit.amount !== amount ||
                    deposit.currency !== currency) {
                    throw new Error(
                        'Deposit amount or currency mismatch.'
                    );
                }

                const wallet = await Wallet.findOne({
                    userId,
                    currency
                }).session(session);

                if (!wallet) {
                    throw new Error('Wallet not found.');
                }

                const transaction = await Transaction.create([{
                    userId,
                    walletId: wallet._id,
                    type: 'DEPOSIT',
                    amount,
                    currency,
                    status: 'SUCCESSFUL',
                    reference: paymentReference,
                    provider: 'MONNIFY'
                }], { session });

                wallet.balance += amount;
                await wallet.save({ session });

                await LedgerEntry.create([{
                    userId,
                    walletId: wallet._id,
                    transactionId: transaction[0]._id,
                    type: 'CREDIT',
                    amount,
                    currency,
                    reference: paymentReference,
                    description: 'Confirmed Monnify deposit'
                }], { session });

                deposit.status = 'SUCCESSFUL';
                deposit.transactionId = transaction[0]._id;
                deposit.confirmedAt = new Date();

                await deposit.save({ session });

                result = deposit;
            });

            return result;

        } finally {
            await session.endSession();
        }
    }
}

module.exports = new MonnifyFundingService();
