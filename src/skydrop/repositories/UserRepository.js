'use strict';

const {
    SkyDropUser
} = require('../database/mongoose');

class UserRepository {
    static async create(userData) {
        const user = new SkyDropUser(userData);

        return user.save();
    }

    static async findById(userId) {
        return SkyDropUser.findById(userId);
    }

    static async findPublicById(userId) {
        return SkyDropUser.findById(userId)
            .select('-passwordHash')
            .lean();
    }

    static async findByEmail(email) {
        return SkyDropUser.findOne({
            email: String(email).toLowerCase()
        }).select('-passwordHash');
    }

    static async findByEmailWithPassword(email) {
        return SkyDropUser.findOne({
            email: String(email).toLowerCase()
        }).select('+passwordHash');
    }

    static async updateProfile(userId, updates) {
        return SkyDropUser.findByIdAndUpdate(
            userId,
            {
                $set: updates
            },
            {
                new: true,
                runValidators: true
            }
        ).select('-passwordHash');
    }

    static async deleteById(userId) {
        return SkyDropUser.findByIdAndDelete(userId);
    }

    static async exists(userId) {
        const user = await SkyDropUser.exists({
            _id: userId
        });

        return Boolean(user);
    }
}

module.exports = UserRepository;
