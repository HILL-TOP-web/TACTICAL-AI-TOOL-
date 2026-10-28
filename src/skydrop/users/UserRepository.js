'use strict';

const mongoose = require('mongoose');
const {
    requireDatabaseConnection
} = require('../database/database');

const { Schema } = mongoose;

const USER_COLLECTION = 'skydrop_users';

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 254
        },

        username: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 30
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        phoneNumber: {
            type: String,
            default: null,
            trim: true,
            maxlength: 30
        },

        accountStatus: {
            type: String,
            enum: [
                'pending',
                'active',
                'suspended',
                'closed'
            ],
            default: 'pending',
            required: true
        },

        emailVerified: {
            type: Boolean,
            default: false
        },

        kycStatus: {
            type: String,
            enum: [
                'not_started',
                'pending',
                'verified',
                'rejected'
            ],
            default: 'not_started'
        },

        roles: {
            type: [{
                type: String,
                trim: true
            }],
            default: ['user']
        },

        lastLoginAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        strict: 'throw',
        versionKey: '__v',
        collection: USER_COLLECTION
    }
);

userSchema.index(
    { email: 1 },
    { unique: true, name: 'unique_user_email' }
);

userSchema.index(
    { username: 1 },
    { unique: true, name: 'unique_user_username' }
);

userSchema.index(
    { accountStatus: 1, createdAt: -1 },
    { name: 'user_status_created_at' }
);

const User =
    mongoose.models.SkyDropUser ||
    mongoose.model(
        'SkyDropUser',
        userSchema,
        USER_COLLECTION
    );

class UserRepository {
    constructor() {
        this.model = User;
    }

    async create(userData, options = {}) {
        requireDatabaseConnection();

        const {
            email,
            username,
            fullName,
            passwordHash,
            phoneNumber
        } = userData || {};

        if (
            !email ||
            !username ||
            !fullName ||
            !passwordHash
        ) {
            throw new Error(
                'Email, username, full name, and password hash are required.'
            );
        }

        const user = new this.model({
            email,
            username,
            fullName,
            passwordHash,
            phoneNumber
        });

        return user.save({
            session: options.session
        });
    }

    async findById(userId, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(userId)) {
            return null;
        }

        let query = this.model.findById(userId);

        if (options.includePasswordHash) {
            query = query.select('+passwordHash');
        }

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async findByEmail(email, options = {}) {
        requireDatabaseConnection();

        if (!email || typeof email !== 'string') {
            return null;
        }

        let query = this.model.findOne({
            email: email.trim().toLowerCase()
        });

        if (options.includePasswordHash) {
            query = query.select('+passwordHash');
        }

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async findByUsername(username, options = {}) {
        requireDatabaseConnection();

        if (!username || typeof username !== 'string') {
            return null;
        }

        let query = this.model.findOne({
            username: username.trim()
        });

        if (options.session) {
            query = query.session(options.session);
        }

        return query.exec();
    }

    async updateAccountStatus(userId, accountStatus, options = {}) {
        requireDatabaseConnection();

        const allowedStatuses = [
            'pending',
            'active',
            'suspended',
            'closed'
        ];

        if (!allowedStatuses.includes(accountStatus)) {
            throw new Error('Invalid account status.');
        }

        if (!mongoose.isValidObjectId(userId)) {
            throw new Error('Invalid user ID.');
        }

        return this.model.findByIdAndUpdate(
            userId,
            { $set: { accountStatus } },
            {
                new: true,
                runValidators: true,
                session: options.session
            }
        ).exec();
    }

    async updateKycStatus(userId, kycStatus, options = {}) {
        requireDatabaseConnection();

        const allowedStatuses = [
            'not_started',
            'pending',
            'verified',
            'rejected'
        ];

        if (!allowedStatuses.includes(kycStatus)) {
            throw new Error('Invalid KYC status.');
        }

        if (!mongoose.isValidObjectId(userId)) {
            throw new Error('Invalid user ID.');
        }

        return this.model.findByIdAndUpdate(
            userId,
            { $set: { kycStatus } },
            {
                new: true,
                runValidators: true,
                session: options.session
            }
        ).exec();
    }

    async recordLogin(userId, options = {}) {
        requireDatabaseConnection();

        if (!mongoose.isValidObjectId(userId)) {
            throw new Error('Invalid user ID.');
        }

        return this.model.findOneAndUpdate(
            {
                _id: userId,
                accountStatus: 'active'
            },
            {
                $set: { lastLoginAt: new Date() }
            },
            {
                new: true,
                session: options.session
            }
        ).exec();
    }
}

module.exports = {
    UserRepository,
    User,
    USER_COLLECTION
};
