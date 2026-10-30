'use strict';

const MiningEngine = require('./MiningEngine');
const MiningSession = require('./miningSession');
const MiningRewards = require('./miningRewards');

const {
    getMiningLevel
} = require('./miningLevels');

class MiningService {
    static async start(userId) {
        const session = await MiningEngine.startMining(userId);

        return {
            message: 'Mining started successfully.',
            mining: this.formatSession(session)
        };
    }

    static async stop(userId) {
        const session = await MiningEngine.stopMining(userId);

        return {
            message: 'Mining stopped successfully.',
            mining: this.formatSession(session)
        };
    }

    static async getStatus(userId) {
        const session = await MiningSession.getStatus(userId);

        return {
            mining: this.formatSession(session),
            rewardPerSecond: MiningRewards.getRewardPerSecond(),
            asset: 'SKD',
            level: getMiningLevel(session.totalSeconds)
        };
    }

    static formatSession(session) {
        return {
            active: session.isActive,
            startedAt: session.startedAt,
            lastRewardAt: session.lastRewardAt,
            totalSeconds: session.totalSeconds,
            totalEarned: session.totalEarned.toString(),
            lastProcessedSecond: session.lastProcessedSecond
        };
    }

    static async restore() {
        return MiningEngine.restoreActiveSessions();
    }

    static async shutdown() {
        return MiningEngine.shutdown();
    }
}

module.exports = MiningService;
