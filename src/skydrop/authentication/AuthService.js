'use strict';

const AuthRepository = require('./AuthRepository');
const PasswordService = require('./PasswordService');
const TokenService = require('./TokenService');
const AuthValidator = require('./AuthValidator');
const AuthConfig = require('./AuthConfig');

function createAuthError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function publicUser(user) {
    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
    };
}

async function register(input) {
    const validation = AuthValidator.validateRegistration(input);

    if (!validation.valid) {
        throw createAuthError(
            validation.errors.join(' '),
            400
        );
    }

    const { name, email, password } = validation.data;

    const existingUser = await AuthRepository.findByEmail(email);

    if (existingUser) {
        throw createAuthError(
            'An account with this email already exists.',
            409
        );
    }

    const passwordHash =
        await PasswordService.hashPassword(password);

    let user;

    try {
        user = await AuthRepository.createUser({
            name,
            email,
            passwordHash
        });
    } catch (error) {
        // Handles concurrent registrations for the same email.
        if (error && error.code === 11000) {
            throw createAuthError(
                'An account with this email already exists.',
                409
            );
        }

        throw error;
    }

    return {
        user: publicUser(user)
    };
}

async function login(input) {
    const validation = AuthValidator.validateLogin(input);

    if (!validation.valid) {
        throw createAuthError(
            validation.errors.join(' '),
            400
        );
    }

    const { email, password } = validation.data;

    const user = await AuthRepository.findByEmail(email);

    if (!user) {
        throw createAuthError(
            'Invalid email or password.',
            401
        );
    }

    if (user.status !== 'active') {
        throw createAuthError(
            'This account is not active.',
            403
        );
    }

    if (
        user.lockedUntil &&
        user.lockedUntil.getTime() > Date.now()
    ) {
        throw createAuthError(
            'Too many failed attempts. Please try again later.',
            429
        );
    }

    if (
        user.lockedUntil &&
        user.lockedUntil.getTime() <= Date.now()
    ) {
        await AuthRepository.resetFailedAttempts(user._id);

        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
    }

    const passwordMatches =
        await PasswordService.verifyPassword(
            password,
            user.passwordHash
        );

    if (!passwordMatches) {
        const updatedUser =
            await AuthRepository.incrementFailedAttempts(user._id);

        const attempts = updatedUser
            ? updatedUser.failedLoginAttempts
            : user.failedLoginAttempts + 1;

        if (attempts >= AuthConfig.loginMaxAttempts) {
            const lockedUntil = new Date(
                Date.now() +
                AuthConfig.loginLockMinutes * 60 * 1000
            );

            await AuthRepository.updateLoginState(user._id, {
                lockedUntil
            });
        }

        throw createAuthError(
            'Invalid email or password.',
            401
        );
    }

    await AuthRepository.resetFailedAttempts(user._id);

    await AuthRepository.updateLoginState(user._id, {
        lastLoginAt: new Date()
    });

    const token = TokenService.createAccessToken(user);

    return {
        user: publicUser(user),
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: AuthConfig.jwtExpiresIn
    };
}

async function getCurrentUser(userId) {
    const user =
        await AuthRepository.findPublicUserById(userId);

    if (!user || user.status !== 'active') {
        throw createAuthError(
            'User account not found or inactive.',
            401
        );
    }

    return publicUser(user);
}

module.exports = {
    register,
    login,
    getCurrentUser
};
