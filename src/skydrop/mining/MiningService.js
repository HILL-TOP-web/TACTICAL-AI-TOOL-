'use strict';

function createMiningService({
    miningEngine,
    MiningSession
}) {
    if (!miningEngine || !MiningSession) {
        throw new Error(
            'MiningEngine and MiningSession are required.'
        );
    }

    async function startMining(userId) {
        return miningEngine.start(userId);
    }

    async function claimMiningReward(userId, sessionId) {
        return miningEngine.claimReward(
            userId,
            sessionId
        );
    }

    async function stopMining(userId, sessionId) {
        return miningEngine.stop(
            userId,
            sessionId
        );
    }

    async function getActiveSession(userId) {
        return MiningSession.findOne({
            userId,
            status: 'ACTIVE'
        }).lean();
    }

    async function getMiningHistory(userId) {
        return MiningSession.find({
            userId
        })
            .sort({ createdAt: -1 })
            .lean();
    }

    return {
        startMining,
        claimMiningReward,
        stopMining,
        getActiveSession,
        getMiningHistory
    };
}

module.exports = {
    createMiningService
};
