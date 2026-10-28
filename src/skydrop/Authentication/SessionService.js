'use strict';

const crypto = require('node:crypto');
const mongoose = require('mongoose');

const {
    SessionRepository
} = require('./SessionRepository');

const {
    requireDatabaseConnection
} = require('../database/database');

const {
    UserRepository
} = require('../users/UserRepository');

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token) {
    return crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
}

function tokensMatch(expectedHash, actualHash) {
    if (
        typeof expectedHash !== 'string' ||
        typeof actualHash !== 'string'
    ) {
        return false;
    }

    const expected = Buffer.from(expectedHash, 'hex');
    const actual = Buffer.from(actualHash, 'hex');

    return (
        expected.length === actual.length &&
        crypto.timingSafeEqual(expected, actual)
    );
}

class SessionService {
    constructor(options = {}) {
        this.sessionRepository =
            options.sessionRepository || new SessionRepository();

        this.userRepository =
            options.userRepository || new UserRepository();

        this.durationMs = SESSION_DURATION_MS;
    }

    async createSession(userId, metadata = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(userId)) {
            throw new Error('Invalid user ID.');
        }

        const user = await this.userRepository.findById(userId);

        if (!user || user.accountStatus !== 'active') {
            throw new Error('An active user account is required.');
        }

        const refreshToken = crypto
            .randomBytes(48)
            .toString('base64url');

        const expiresAt = new Date(
            Date.now() + this.durationMs
        );

        const session = await this.sessionRepository.create({
            userId,
            refreshTokenHash: hashToken(refreshToken),
            expiresAt,
            userAgent: metadata.userAgent,
            ipAddress: metadata.ipAddress
        });

        return {
            sessionId: session._id.toString(),
            refreshToken,
            expiresAt
        };
    }

    async validateRefreshToken(sessionId, refreshToken) {
        requireDatabaseConnection();

        if (
            !mongoose.isValidObjectId(sessionId) ||
            typeof refreshToken !== 'string' ||
            refreshToken.length < 32 ||
            refreshToken.length > 200
        ) {
            return null;
        }

        const session =
            await this.sessionRepository.findActiveById(
                sessionId,
                {
                    includeRefreshTokenHash: true
                }
            );

        if (!session) {
            return null;
        }

        const suppliedHash = hashToken(refreshToken);

        if (
            !tokensMatch(
                session.refreshTokenHash,
                suppliedHash
            )
        ) {
            return null;
        }

        const user = await this.userRepository.findById(
            session.userId
        );

        if (!user || user.accountStatus !== 'active') {
            return null;
        }

        await this.sessionRepository.touch(session._id);

        return {
            sessionId: session._id.toString(),
            user
        };
    }

    async rotateRefreshToken(sessionId, currentRefreshToken) {
        requireDatabaseConnection();

        const validated = await this.validateRefreshToken(
            sessionId,
            currentRefreshToken
        );

        if (!validated) {
            throw new Error('Invalid or expired session.');
        }

        /*
         * Rotation must atomically consume the previous token.
         * A conditional database update prevents two concurrent
         * requests from both successfully rotating the same token.
         */

        const currentHash = hashToken(currentRefreshToken);

        const replacementToken = crypto
            .randomBytes(48)
            .toString('base64url');

        const replacementHash = hashToken(replacementToken);

        const expiresAt = new Date(
            Date.now() + this.durationMs
        );

        const consumed = await this.sessionRepository.model
            .findOneAndUpdate(
                {
                    _id: sessionId,
                    refreshTokenHash: currentHash,
                    revokedAt: null,
                    expiresAt: { $gt: new Date() }
                },
                {
                    $set: {
                        refreshTokenHash: replacementHash,
                        expiresAt,
                        lastUsedAt: new Date()
                    }
                },
                {
                    new: true
                }
            )
            .exec();

        if (!consumed) {
            throw new Error(
                'Refresh token was already used or the session expired.'
            );
        }

        return {
            sessionId: consumed._id.toString(),
            refreshToken: replacementToken,
            expiresAt
        };
    }

    async revokeSession(sessionId) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(sessionId)) {
            return false;
        }

        const result = await this.sessionRepository.revoke(
            sessionId
        );

        return Boolean(result);
    }

    async revokeAllSessions(userId) {
        requireDatabaseConnection();

        return this.sessionRepository.revokeAllForUser(userId);
    }
}

module.exports = {
    SessionService,
    hashToken
};
