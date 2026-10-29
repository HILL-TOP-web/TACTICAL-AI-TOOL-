'use strict';

const User = require('../users/UserModel');

async function createUser(userData) {
    const user = await User.create(userData);

    return user.toObject();
}

async function findByEmail(email) {
    return User.findOne({
        email: String(email).trim().toLowerCase()
    })
        .select('+passwordHash')
        .exec();
}

async function findById(userId) {
    return User.findById(userId).exec();
}

async function updateLoginState(userId, updates) {
    return User.findByIdAndUpdate(
        userId,
        {
            $set: updates
        },
        {
            new: true,
            runValidators: true
        }
    ).exec();
}

async function incrementFailedAttempts(userId) {
    return User.findByIdAndUpdate(
        userId,
        {
            $inc: {
                failedLoginAttempts: 1
            }
        },
        {
            new: true
        }
    ).exec();
}

async function resetFailedAttempts(userId) {
    return updateLoginState(userId, {
        failedLoginAttempts: 0,
        lockedUntil: null
    });
}

async function findPublicUserById(userId) {
    return User.findById(userId)
        .select(
            '_id name email role status emailVerified createdAt updatedAt'
        )
        .lean()
        .exec();
}

module.exports = {
    createUser,
    findByEmail,
    findById,
    updateLoginState,
    incrementFailedAttempts,
    resetFailedAttempts,
    findPublicUserById
};
