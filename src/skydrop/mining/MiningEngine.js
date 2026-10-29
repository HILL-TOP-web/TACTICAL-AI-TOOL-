'use strict';

const mongoose = require('mongoose');

function createMiningEngine({
    MiningSession,
    walletService,
    transactionService
}) {
    if (!MiningSession) {
        throw new Error(
            'MiningSession model is required.'
        );
    }

    if (!walletService || !transactionService) {
        throw new Error(
            'WalletService and TransactionService are required.'
        );
    }

    function getMiningConfig() {
        return {
            enabled:
                process.env.SKYDROP_MINING_ENABLED === 'true',

            initialReward: Number(
                process.env.SKYDROP_MINING_INITIAL_REWARD ||
                0.00001
            ),

            intervalMs: Number(
                process.env.SKYDROP_MINING_INTERVAL_MS ||
                300000
            )
        };
    }

    async function start(userId) {
        const config = getMiningConfig();

        if (!config.enabled) {
            throw new Error('Mining is disabled.');
        }

        if (!mongoose.isValidObjectId(userId)) {
            throw new Error('Invalid user ID.');
        }

        const existing = await MiningSession.findOne({
            userId,
            status: 'ACTIVE'
        });

        if (existing) {
            return existing;
        }

        return MiningSession.create({
            userId,
            status: 'ACTIVE',
            startedAt: new Date()
        });
    }

    async function claimReward(userId, sessionId) {
        const config = getMiningConfig();

        if (!config.enabled) {
            throw new Error('Mining is disabled.');
        }

        if (
            !mongoose.isValidObjectId(userId) ||
            !mongoose.isValidObjectId(sessionId)
        ) {
            throw new Error(
                'Invalid mining session.'
            );
        }

        /*
         * This atomic update prevents two simultaneous
         * requests from claiming the same reward interval.
         *
         * Production deployments should perform the reward
         * claim, transaction creation and wallet/ledger
         * update within one MongoDB transaction, or use
         * a durable claim record with a unique reward key.
         */
        const now = new Date();

        const session = await MiningSession.findOneAndUpdate(
            {
                _id: sessionId,
                userId,
                status: 'ACTIVE',

                $or: [
                    { lastRewardAt: null },

                    {
                        lastRewardAt: {
                            $lte: new Date(
                                now.getTime() -
                                config.intervalMs
                            )
                        }
                    }
                ]
            },
            {
                $set: {
                    lastRewardAt: now
                }
            },
            {
                new: true
            }
        );

        if (!session) {
            throw new Error(
                'Mining session is not eligible for a reward.'
            );
        }

        const reward = config.initialReward;

        const reference =
            `MIN-${session._id}-${now.getTime()}`;

        /*
         * This call must be idempotent and must create a
         * durable SKD transaction and ledger entry.
         */
        await transactionService.creditMiningReward({
            userId,
            reference,
            amount: reward,
            asset: 'SKD',
            sessionId: String(session._id)
        });

        session.totalReward =
            mongoose.Types.Decimal128.fromString(
                (
                    Number(
                        session.totalReward.toString()
                    ) + reward
                ).toFixed(12)
            );

        session.rewardCount += 1;

        await session.save();

        return {
            sessionId: String(session._id),
            reward,
            asset: 'SKD',
            totalReward: session.totalReward.toString(),
            rewardCount: session.rewardCount
        };
    }

    async function stop(userId, sessionId) {
        const session =
            await MiningSession.findOneAndUpdate(
                {
                    _id: sessionId,
                    userId,
                    status: 'ACTIVE'
                },
                {
                    $set: {
                        status: 'STOPPED',
                        stoppedAt: new Date()
                    }
                },
                {
                    new: true
                }
            );

        if (!session) {
            throw new Error(
                'Active mining session not found.'
            );
        }

        return session;
    }

    return {
        start,
        claimReward,
        stop
    };
}

module.exports = {
    createMiningEngine
};
