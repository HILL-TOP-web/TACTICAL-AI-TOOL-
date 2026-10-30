'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserRepository = require('../repositories/UserRepository');
const WalletService = require('../wallet/WalletService');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error(
            'JWT_SECRET must be configured with at least 32 characters.'
        );
    }

    return secret;
}

class UserService {
    static async register(userData) {
        const email = String(userData.email || '')
            .trim()
            .toLowerCase();

        const password = String(userData.password || '');

        if (!EMAIL_PATTERN.test(email)) {
            throw new Error('A valid email address is required.');
        }

        if (password.length < 12) {
            throw new Error(
                'Password must contain at least 12 characters.'
            );
        }

        if (password.length > 128) {
            throw new Error('Password is too long.');
        }

        const existingUser = await UserRepository.findByEmail(email);

        if (existingUser) {
            throw new Error('An account with this email already exists.');
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await UserRepository.create({
            email,
            passwordHash,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName
        });

        try {
            await WalletService.createWallet(user._id);
        } catch (error) {
            await UserRepository.deleteById(user._id);
            throw error;
        }

        return this.createAuthenticationResponse(user);
    }

    static async login(emailInput, passwordInput) {
        const email = String(emailInput || '')
            .trim()
            .toLowerCase();

        const password = String(passwordInput || '');

        if (!email || !password) {
            throw new Error('Email and password are required.');
        }

        const user = await UserRepository.findByEmailWithPassword(email);

        if (!user) {
            throw new Error('Invalid email or password.');
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            throw new Error('Invalid email or password.');
        }

        return this.createAuthenticationResponse(user);
    }

    static createAuthenticationResponse(user) {
        const token = jwt.sign(
            {
                sub: String(user._id),
                role: user.role
            },
            getJwtSecret(),
            {
                algorithm: 'HS256',
                expiresIn: process.env.JWT_EXPIRES_IN || '1d',
                issuer: 'skydrop',
                audience: 'skydrop-users'
            }
        );

        return {
            token,
            tokenType: 'Bearer',
            expiresIn: process.env.JWT_EXPIRES_IN || '1d',
            user: {
                id: String(user._id),
                email: user.email,
                username: user.username || null,
                firstName: user.firstName || null,
                lastName: user.lastName || null,
                role: user.role,
                emailVerified: user.emailVerified
            }
        };
    }

    static async getProfile(userId) {
        const user = await UserRepository.findPublicById(userId);

        if (!user) {
            throw new Error('User not found.');
        }

        return user;
    }

    static async updateProfile(userId, updates) {
        const allowedUpdates = {};

        const permittedFields = [
            'username',
            'firstName',
            'lastName'
        ];

        for (const field of permittedFields) {
            if (Object.prototype.hasOwnProperty.call(updates, field)) {
                allowedUpdates[field] = updates[field];
            }
        }

        return UserRepository.updateProfile(userId, allowedUpdates);
    }
}

module.exports = UserService;
