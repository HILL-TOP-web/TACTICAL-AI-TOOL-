'use strict';

const mongoose = require('mongoose');

const User = require('../models/User');

class UserRepository {

    validateId(id) {

        if (!mongoose.isValidObjectId(id)) {
            throw new Error('Invalid user ID.');
        }
    }

    async create(data) {
        return User.create(data);
    }

    async findById(id) {

        this.validateId(id);

        return User.findById(id)
            .select('-password -passwordHash');
    }

    async findByEmail(email) {

        return User.findOne({
            email: email.toLowerCase()
        });
    }

    async update(id, updates) {

        this.validateId(id);

        return User.findByIdAndUpdate(
            id,
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        ).select('-password -passwordHash');
    }

    async delete(id) {

        this.validateId(id);

        return User.findByIdAndDelete(id);
    }
}

module.exports = new UserRepository();
