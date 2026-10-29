'use strict';

const User = require('../models/User');

class UserRepository {
    async create(userData, options = {}) {
        const user = new User(userData);

        await user.save(options);

        return user;
    }

    async findById(userId, options = {}) {
        return User.findById(userId, null, options);
    }

    async findByEmail(email, options = {}) {
        if (!email) {
            return null;
        }

        return User.findOne({
            email: String(email).trim().toLowerCase()
        }, null, options);
    }

    async findByUsername(username, options = {}) {
        if (!username) {
            return null;
        }

        return User.findOne({
            username: String(username).trim().toLowerCase()
        }, null, options);
    }

    async findByIdWithPasswordHash(userId) {
        return User.findById(userId)
            .select('+passwordHash');
    }

    async updateById(userId, updates, options = {}) {
        const allowedFields = [
            'firstName',
            'lastName',
            'status',
            'emailVerified',
            'kycStatus',
            'lastLoginAt'
        ];

        const safeUpdates = {};

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(updates, field)) {
                safeUpdates[field] = updates[field];
            }
        }

        if (Object.keys(safeUpdates).length === 0) {
            throw new Error('No permitted user updates supplied.');
        }

        return User.findByIdAndUpdate(
            userId,
            {
                $set: safeUpdates
            },
            {
                new: true,
                runValidators: true,
                ...options
            }
        );
    }

    async addWallet(userId, walletId, options = {}) {
        return User.findByIdAndUpdate(
            userId,
            {
                $addToSet: {
                    walletIds: walletId
                }
            },
            {
                new: true,
                runValidators: true,
                ...options
            }
        );
    }

    async list(options = {}) {
        const {
            page = 1,
            limit = 20,
            status
        } = options;

        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(
            100,
            Math.max(1, Number(limit) || 20)
        );

        const filter = {};

        if (status) {
            filter.status = status;
        }

        return User.find(filter)
            .sort({
                createdAt: -1
            })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit);
    }

    async count(filter = {}) {
        return User.countDocuments(filter);
    }
}

module.exports = new UserRepository();
module.exports.UserRepository = UserRepository;
