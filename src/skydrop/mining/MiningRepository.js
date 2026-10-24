'use strict';

const crypto = require('crypto');

class MiningRepository {
    constructor(options = {}) {
        this.sessions = new Map();
        this.clock = options.clock || (() => Date.now());
    }

    create(userId, data = {}) {
        this._validateUserId(userId);

        const existing = this.findActiveByUserId(userId);

        if (existing) {
            throw new Error(
                'This user already has an active mining session.'
            );
        }

        const now = this.clock();

        const session = {
            id: crypto.randomUUID(),
            userId: String(userId),
            status: 'active',
            startedAt: now,
            lastClaimAt: now,
            stoppedAt: null,
            claimedAmount: 0,
            pendingAmount: 0,
            multiplier: 1,
            createdAt: now,
            updatedAt: now,
            metadata: {
                ...data.metadata
            }
        };

        this.sessions.set(session.id, session);

        return this._clone(session);
    }

    findById(sessionId) {
        const session = this.sessions.get(sessionId);

        return session ? this._clone(session) : null;
    }

    findByUserId(userId) {
        const normalizedId = String(userId);

        const sessions = Array.from(
            this.sessions.values()
        ).filter(
            session => session.userId === normalizedId
        );

        return sessions.map(session => this._clone(session));
    }

    findActiveByUserId(userId) {
        const normalizedId = String(userId);

        const session = Array.from(
            this.sessions.values()
        ).find(
            item =>
                item.userId === normalizedId &&
                item.status === 'active'
        );

        return session ? this._clone(session) : null;
    }

    update(sessionId, updates = {}) {
        const session = this.sessions.get(sessionId);

        if (!session) {
            throw new Error('Mining session not found.');
        }

        const protectedFields = [
            'id',
            'userId',
            'createdAt'
        ];

        for (const field of protectedFields) {
            if (
                Object.prototype.hasOwnProperty.call(
                    updates,
                    field
                )
            ) {
                throw new Error(
                    `Cannot update protected field: ${field}`
                );
            }
        }

        const updated = {
            ...session,
            ...updates,
            updatedAt: this.clock()
        };

        this.sessions.set(sessionId, updated);

        return this._clone(updated);
    }

    list(options = {}) {
        const {
            userId,
            status,
            limit = 100,
            offset = 0
        } = options;

        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 1000
        ) {
            throw new TypeError(
                'Limit must be an integer between 1 and 1000.'
            );
        }

        if (!Number.isInteger(offset) || offset < 0) {
            throw new TypeError(
                'Offset must be a non-negative integer.'
            );
        }

        let results = Array.from(this.sessions.values());

        if (userId !== undefined) {
            results = results.filter(
                session => session.userId === String(userId)
            );
        }

        if (status !== undefined) {
            results = results.filter(
                session => session.status === status
            );
        }

        results.sort(
            (a, b) => b.createdAt - a.createdAt
        );

        return results
            .slice(offset, offset + limit)
            .map(session => this._clone(session));
    }

    delete(sessionId) {
        const session = this.sessions.get(sessionId);

        if (!session) {
            return false;
        }

        if (session.status === 'active') {
            throw new Error(
                'An active mining session cannot be deleted.'
            );
        }

        return this.sessions.delete(sessionId);
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

    _clone(value) {
        return JSON.parse(JSON.stringify(value));
    }
}

module.exports = MiningRepository;
