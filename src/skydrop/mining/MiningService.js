'use strict';

const MiningConfig = require('./MiningConfig');
const MiningRepository = require('./MiningRepository');

class MiningService {
    constructor(options = {}) {
        this.config = options.config || MiningConfig;

        this.repository =
            options.repository || new MiningRepository();

        this.clock = options.clock || (() => Date.now());

        this.walletService = options.walletService || null;

        this.allowedMultipliers = new Set([
            1,
            2,
            5,
            10,
            30,
            300
        ]);
    }

    async start(userId) {
        this._assertEnabled();
        this._validateUserId(userId);

        const existing =
            this.repository.findActiveByUserId(userId);

        if (existing) {
            return this.getStatus(userId);
        }

        const session = this.repository.create(userId);

        return this._formatStatus(session);
    }

    async stop(userId) {
        this._validateUserId(userId);

        const session =
            this.repository.findActiveByUserId(userId);

        if (!session) {
            throw new Error(
                'No active mining session was found.'
            );
        }

        const now = this.clock();

        const reward = this._calculateReward(
            session,
            now
        );

        const updated = this.repository.update(
            session.id,
            {
                status: 'stopped',
                stoppedAt: now,
                pendingAmount: this._round(
                    session.pendingAmount + reward
                )
            }
        );

        return this._formatStatus(updated);
    }

    async getStatus(userId) {
        this._validateUserId(userId);

        const session =
            this.repository.findActiveByUserId(userId);

        if (!session) {
            const sessions =
                this.repository.findByUserId(userId);

            const latest = sessions[0];

            if (!latest) {
                return {
                    userId: String(userId),
                    status: 'idle',
                    currency: this.config.currency,
                    pendingAmount: 0,
                    claimedAmount: 0
                };
            }

            return this._formatStatus(latest);
        }

        return this._formatStatus(session);
    }

    async claim(userId) {
        this._assertEnabled();
        this._validateUserId(userId);

        const session =
            this.repository.findActiveByUserId(userId);

        if (!session) {
            throw new Error(
                'No active mining session was found.'
            );
        }

        const now = this.clock();

        const newlyEarned = this._calculateReward(
            session,
            now
        );

        const totalPending = this._round(
            session.pendingAmount + newlyEarned
        );

        if (totalPending <= 0) {
            throw new Error(
                'No mining reward is available to claim yet.'
            );
        }

        if (
            totalPending > this.config.maxClaimAmount
        ) {
            throw new Error(
                'Mining reward exceeds the configured claim limit.'
            );
        }

        /*
         * A real wallet integration is required before claiming
         * can credit actual SKD balances.
         *
         * The wallet operation must be atomic and idempotent.
         */
        if (
            !this.walletService ||
            typeof this.walletService.credit !== 'function'
        ) {
            throw new Error(
                'Mining wallet integration is not configured. ' +
                'The reward has not been claimed.'
            );
        }

        const claimId =
            `mining:${session.id}:${session.lastClaimAt}`;

        /*
         * The wallet service should support an idempotency key
         * so retrying a request cannot credit the same reward twice.
         */
        await this.walletService.credit({
            userId: String(userId),
            amount: totalPending,
            currency: this.config.currency,
            reference: claimId,
            idempotencyKey: claimId,
            description: 'SkyDrop mining reward'
        });

        const updated = this.repository.update(
            session.id,
            {
                lastClaimAt: now,
                pendingAmount: 0,
                claimedAmount: this._round(
                    session.claimedAmount + totalPending
                )
            }
        );

        return {
            success: true,
            userId: String(userId),
            sessionId: session.id,
            claimedAmount: totalPending,
            totalClaimed: updated.claimedAmount,
            currency: this.config.currency,
            claimedAt: now
        };
    }

    async setSpeed(userId, multiplier) {
        this._assertEnabled();
        this._validateUserId(userId);

        if (!this.allowedMultipliers.has(multiplier)) {
            throw new Error(
                'Unsupported mining multiplier.'
            );
        }

        const session =
            this.repository.findActiveByUserId(userId);

        if (!session) {
            throw new Error(
                'No active mining session was found.'
            );
        }

        const now = this.clock();

        /*
         * Accrue the reward earned at the old multiplier
         * before changing the multiplier.
         */
        const earned = this._calculateReward(
            session,
            now
        );

        const updated = this.repository.update(
            session.id,
            {
                lastClaimAt: now,
                pendingAmount: this._round(
                    session.pendingAmount + earned
                ),
                multiplier
            }
        );

        return this._formatStatus(updated);
    }

    _calculateReward(session, now) {
        if (session.status !== 'active') {
            return 0;
        }

        const elapsed = Math.max(
            0,
            Math.min(
                now - session.lastClaimAt,
                this.config.maxSessionMs
            )
        );

        return this.config.getReward(
            elapsed,
            session.multiplier
        );
    }

    _formatStatus(session) {
        const now = this.clock();

        const earned = this._calculateReward(
            session,
            now
        );

        const pendingAmount = this._round(
            session.pendingAmount + earned
        );

        return {
            sessionId: session.id,
            userId: session.userId,
            status: session.status,
            currency: this.config.currency,
            startedAt: session.startedAt,
            lastClaimAt: session.lastClaimAt,
            stoppedAt: session.stoppedAt,
            multiplier: session.multiplier,
            pendingAmount,
            claimedAmount: session.claimedAmount,
            elapsedMs: Math.max(
                0,
                now - session.startedAt
            )
        };
    }

    _round(value) {
        return Number(
            value.toFixed(this.config.decimalPlaces)
        );
    }

    _validateUserId(userId) {
        if (
            userId === undefined ||
            userId === null ||
            String(userId).trim() === ''
        ) {
            throw new TypeError(
                'A valid user ID is required.'
            );
        }
    }

    _assertEnabled() {
        if (!this.config.enabled) {
            throw new Error(
                'Mining is currently disabled.'
            );
        }
    }
}

module.exports = MiningService;
