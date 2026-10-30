'use strict';

const {
    SkyDropMiningSession,
    SkyDropUser
} = require('../database/mongoose');

class MiningSession {
    static async getOrCreate(userId) {
        let session = await SkyDropMiningSession.findOne({ userId });

        if (!session) {
            try {
                session = await SkyDropMiningSession.create({
                    userId,
                    isActive: false,
                    totalEarned: '0',
                    totalSeconds: 0,
                    lastProcessedSecond: 0
                });
            } catch (error) {
                if (error.code !== 11000) {
                    throw error;
                }

                session = await SkyDropMiningSession.findOne({ userId });
            }
        }

        return session;
    }

    static async start(userId) {
        const user = await SkyDropUser.findById(userId);

        if (!user) {
            throw new Error('User not found.');
        }

        if (!user.miningEnabled) {
            throw new Error('Mining is not available for this account.');
        }

        const session = await this.getOrCreate(userId);

        if (session.isActive) {
            return {
                session,
                alreadyActive: true
            };
        }

        const now = new Date();

        session.isActive = true;
        session.startedAt = now;
        session.lastRewardAt = now;
        session.lastProcessedSecond = 0;

        await session.save();

        return {
            session,
            alreadyActive: false
        };
    }

    static async stop(userId) {
        const session = await SkyDropMiningSession.findOne({ userId });

        if (!session) {
            throw new Error('Mining session not found.');
        }

        if (!session.isActive) {
            return {
                session,
                alreadyStopped: true
            };
        }

        session.isActive = false;
        session.lastStoppedAt = new Date();

        await session.save();

        return {
            session,
            alreadyStopped: false
        };
    }

    static async getStatus(userId) {
        return this.getOrCreate(userId);
    }

    static async getActiveSessions() {
        return SkyDropMiningSession.find({
            isActive: true
        }).select('userId startedAt lastRewardAt lastProcessedSecond');
    }
}

module.exports = MiningSession;
