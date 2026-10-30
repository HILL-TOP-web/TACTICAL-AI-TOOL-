'use strict';

const UserRepository = require('../repositories/UserRepository');

class UserService {

    async createUser(data) {

        const email = String(data.email || '')
            .trim()
            .toLowerCase();

        if (!email || !data.password) {
            throw new Error(
                'Email and password are required.'
            );
        }

        if (data.password.length < 12) {
            throw new Error(
                'Password must contain at least 12 characters.'
            );
        }

        const existing = await UserRepository.findByEmail(email);

        if (existing) {
            throw new Error('User already exists.');
        }

        return UserRepository.create({
            ...data,
            email,
            role: 'user',
            status: 'ACTIVE'
        });
    }

    async getUserById(userId) {

        if (!userId) {
            throw new Error('User ID is required.');
        }

        return UserRepository.findById(userId);
    }

    async getUserByEmail(email) {

        if (!email) {
            throw new Error('Email is required.');
        }

        return UserRepository.findByEmail(
            email.trim().toLowerCase()
        );
    }

    async updateAccountStatus(userId, status) {

        const permitted = [
            'ACTIVE',
            'SUSPENDED',
            'PENDING'
        ];

        if (!permitted.includes(status)) {
            throw new Error('Invalid account status.');
        }

        return UserRepository.update(userId, {
            status
        });
    }
}

module.exports = new UserService();
