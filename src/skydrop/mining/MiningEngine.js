'use strict';

const MiningTimer = require('./miningTimer');
const MiningRewards = require('./miningRewards');
const MiningSession = require('./miningSession');

const {
    SkyDropMiningSession
} = require('../database/mongoose');

class MiningEngine {
    constructor() {
        this.timers = new Map();
        this.initialized = false;
    }

    async startMining(userId) {
        const result = await MiningSession.start(userId);

        if (!result.session.isActive) {
            throw new Error('Unable to start mining.');
        }

        this.startTimer(userId);

        return result.session;
    }

    startTimer(userId) {
        const key = String(userId);

        if (this.timers.has(key)) {
            return false;
        }

        const timer = new MiningTimer(async () => {
            await this.processCompletedSeconds(userId);
        });

        this.timers.set(key, timer);

        timer.start();

        return true;
    }

    async processCompletedSeconds(userId) {
        const session = await SkyDropMiningSession.findOne({
            userId,
            isActive: true
        });

        if (!session || !session.startedAt) {
            this.stopTimer(userId);
            return;
        }

        const now = Date.now();
        const startedAt = new Date(session.startedAt).getTime();

        const elapsedSeconds = Math.floor(
            (now - startedAt) / 1000
        );

        const secondsToProcess =
            elapsedSeconds - session.lastProcessedSecond;

        if (secondsToProcess <= 0) {
            return;
        }

        for (let index = 0; index < secondsToProcess; index += 1) {
            const nextSecond = session.lastProcessedSecond + 1;

            const result = await MiningRewards.creditCompletedSecond(
                userId,
                nextSecond
            );

            if (!result.credited && !result.duplicate) {
                break;
            }

            if (result.duplicate) {
                const latest = await SkyDropMiningSession.findOne({
                    userId
                });

                if (!latest) {
                    break;
                }

                session.lastProcessedSecond = latest.lastProcessedSecond;
            } else {
                session.lastProcessedSecond = nextSecond;
            }
        }
    }

    stopTimer(userId) {
        const key = String(userId);
        const timer = this.timers.get(key);

        if (!timer) {
            return false;
        }

        timer.stop();
        this.timers.delete(key);

        return true;
    }

    async stopMining(userId) {
        const result = await MiningSession.stop(userId);

        this.stopTimer(userId);

        return result.session;
    }

    async restoreActiveSessions() {
        const sessions = await MiningSession.getActiveSessions();

        for (const session of sessions) {
            this.startTimer(session.userId);
        }

        this.initialized = true;

        return sessions.length;
    }

    async shutdown() {
        for (const timer of this.timers.values()) {
            timer.stop();
        }

        this.timers.clear();
    }

    get runningCount() {
        return this.timers.size;
    }
}

module.exports = new MiningEngine();
