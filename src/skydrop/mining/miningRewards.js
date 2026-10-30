'use strict';

const crypto = require('crypto');

const {
    mongoose,
    SkyDropWallet,
    SkyDropTransaction,
    SkyDropMiningSession
} = require('../database/mongoose');

const { MINING_RATE } = require('./miningRate');

const REWARD_PATTERN = /^\d+(\.\d{1,18})?$/;

function toScaledInteger(value) {
    const [whole, fraction = ''] = String(value).split('.');
    return BigInt(whole) * 1000000000000000000n +
        BigInt(fraction.padEnd(18, '0'));
}

function fromScaledInteger(value) {
    const negative = value < 0n;
    const absolute = negative ? -value : value;

    const whole = absolute / 1000000000000000000n;
    const fraction = (absolute % 1000000000000000000n)
        .toString()
        .padStart(18, '0')
        .replace(/0+$/, '');

    return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

function addDecimalStrings(first, second) {
    return fromScaledInteger(
        toScaledInteger(first) + toScaledInteger(second)
    );
}

class MiningRewards {
    static getRewardPerSecond() {
        return MINING_RATE.REWARD_PER_SECOND;
    }

    static calculateReward(seconds) {
        if (!Number.isSafeInteger(seconds) || seconds < 1) {
            throw new Error('Mining seconds must be a positive integer.');
        }

        if (!REWARD_PATTERN.test(MINING_RATE.REWARD_PER_SECOND)) {
            throw new Error('Invalid mining reward configuration.');
        }

        return fromScaledInteger(
            toScaledInteger(MINING_RATE.REWARD_PER_SECOND) *
            BigInt(seconds)
        );
    }

    static createReference(userId, secondNumber) {
        return crypto
            .createHash('sha256')
            .update(`SKYDROPMINING:${userId}:${secondNumber}`)
            .digest('hex');
    }

    static async creditCompletedSecond(userId, secondNumber) {
        if (!mongoose.connection.readyState) {
            throw new Error('MongoDB is not connected.');
        }

        const amount = this.calculateReward(1);

        const reference = this.createReference(
            userId,
            secondNumber
        );

        const mongoSession = await mongoose.startSession();

        try {
            let result;

            await mongoSession.withTransaction(async () => {
                const existing = await SkyDropTransaction.findOne({
                    reference
                }).session(mongoSession);

                if (existing) {
                    result = {
                        credited: false,
                        duplicate: true,
                        transaction: existing
                    };

                    return;
                }

                const miningSession = await SkyDropMiningSession
                    .findOne({ userId })
                    .session(mongoSession);

                if (!miningSession || !miningSession.isActive) {
                    throw new Error('Mining session is not active.');
                }

                if (secondNumber <= miningSession.lastProcessedSecond) {
                    result = {
                        credited: false,
                        duplicate: true
                    };

                    return;
                }

                if (secondNumber !== miningSession.lastProcessedSecond + 1) {
                    throw new Error('Mining reward sequence is invalid.');
                }

                const wallet = await SkyDropWallet.findOneAndUpdate(
                    { userId },
                    {
                        $inc: {
                            skdBalance: mongoose.Types.Decimal128.fromString(amount)
                        }
                    },
                    {
                        new: true,
                        session: mongoSession
                    }
                );

                if (!wallet) {
                    throw new Error('Wallet not found.');
                }

                const transaction = new SkyDropTransaction({
                    userId,
                    walletId: wallet._id,
                    type: 'mining_reward',
                    asset: 'SKD',
                    amount: mongoose.Types.Decimal128.fromString(amount),
                    status: 'completed',
                    reference,
                    idempotencyKey: reference,
                    description: 'SkyDrop mining reward',
                    metadata: {
                        miningSecond: secondNumber,
                        rewardPerSecond: amount
                    },
                    completedAt: new Date()
                });

                await transaction.save({
                    session: mongoSession
                });

                miningSession.lastProcessedSecond = secondNumber;
                miningSession.totalSeconds += 1;
                miningSession.totalEarned = mongoose.Types.Decimal128.fromString(
                    addDecimalStrings(
                        miningSession.totalEarned.toString(),
                        amount
                    )
                );

                miningSession.lastRewardAt = new Date();

                await miningSession.save({
                    session: mongoSession
                });

                result = {
                    credited: true,
                    duplicate: false,
                    amount,
                    transaction
                };
            });

            return result;
        } finally {
            await mongoSession.endSession();
        }
    }
}

module.exports = MiningRewards;
