'use strict';

const mongoose = require('mongoose');

const {
    requireDatabaseConnection
} = require('../database/database');

const { Schema } = mongoose;

const SESSION_COLLECTION = 'skydrop_sessions';

const sessionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'SkyDropUser',
            required: true,
            index: true
        },

        refreshTokenHash: {
            type: String,
            required: true,
            select: false
        },

        expiresAt: {
            type: Date,
            required: true
        },

        revokedAt: {
            type: Date,
            default: null
        },

        lastUsedAt: {
            type: Date,
            default: null
        },

        userAgent: {
            type: String,
            default: null,
            maxlength: 500
        },

        ipAddress: {
            type: String,
            default: null,
            maxlength: 100
        }
    },
    {
        timestamps: true,
        strict: 'throw',
        collection: SESSION_COLLECTION
    }
);

sessionSchema.index(
    { expiresAt: 1 },
    {
        expireAfterSeconds: 0,
        name: 'session_expiration_ttl'
    }
);

sessionSchema.index(
    { userId: 1, revokedAt: 1, expiresAt: 1 },
    { name: 'user_active_sessions' }
);

const Session =
    mongoose.models.SkyDropSession ||
    mongoose.model(
        'SkyDropSession',
        sessionSchema,
        SESSION_COLLECTION
    );

class SessionRepository {
    constructor() {
        this.model = Session;
    }

    async create(data, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(data.userId)) {
            throw new Error('Invalid session user ID.');
        }

        if (!data.refreshTokenHash || !data.expiresAt) {
            throw new Error(
                'Refresh-token hash and expiration date are required.'
            );
        }

        const session = new this.model({
            userId: data.userId,
            refreshTokenHash: data.refreshTokenHash,
            expiresAt: data.expiresAt,
            userAgent: data.userAgent || null,
            ipAddress: data.ipAddress || null
        });

        return session.save({
            session: options.session
        });
    }

    async findActiveById(sessionId, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(sessionId)) {
            return null;
        }

        let query = this.model.findOne({
            _id: sessionId,
            revokedAt: null,
            expiresAt: { $gt: new Date() }
        });

        if (options.includeRefreshTokenHash) {
            query = query.select('+refreshTokenHash');
        }

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async findById(sessionId, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(sessionId)) {
            return null;
        }

        let query = this.model.findById(sessionId);

        if (options.includeRefreshTokenHash) {
            query = query.select('+refreshTokenHash');
        }

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async touch(sessionId, options = {}) {
        requireDatabaseConnection();

        return this.model.findOneAndUpdate(
            {
                _id: sessionId,
                revokedAt: null,
                expiresAt: { $gt: new Date() }
            },
            {
                $set: {
                    lastUsedAt: new Date()
                }
            },
            {
                new: true,
                session: options.session
            }
        ).exec();
    }

    async revoke(sessionId, options = {}) {
        requireDatabaseConnection();

        return this.model.findOneAndUpdate(
            {
                _id: sessionId,
                revokedAt: null
            },
            {
                $set: {
                    revokedAt: new Date()
                }
            },
            {
                new: true,
                session: options.session
            }
        ).exec();
    }

    async revokeAllForUser(userId, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(userId)) {
            throw new Error('Invalid user ID.');
        }

        return this.model.updateMany(
            {
                userId,
                revokedAt: null
            },
            {
                $set: {
                    revokedAt: new Date()
                }
            },
            {
                session: options.session
            }
        ).exec();
    }
}

module.exports = {
    SessionRepository,
    Session,
    SESSION_COLLECTION
};
