'use strict';

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
    UserRepository
} = require('../users/UserRepository');

const {
    SessionService
} = require('./SessionService');

const {
    requireDatabaseConnection
} = require('../database/database');

const ACCESS_TOKEN_SECRET =
    process.env.SKYDROP_ACCESS_TOKEN_SECRET;

const ACCESS_TOKEN_ISSUER =
    process.env.SKYDROP_TOKEN_ISSUER || 'skydrop-api';

const ACCESS_TOKEN_AUDIENCE =
    process.env.SKYDROP_TOKEN_AUDIENCE || 'skydrop-client';

const ACCESS_TOKEN_TTL = '15m';

const BCRYPT_ROUNDS = 12;

function validateTokenConfiguration() {
    if (
        !ACCESS_TOKEN_SECRET ||
        Buffer.byteLength(ACCESS_TOKEN_SECRET, 'utf8') < 32
    ) {
        throw new Error(
            'SKYDROP_ACCESS_TOKEN_SECRET must contain at least 32 bytes.'
        );
    }
}

function sanitizeUser(user) {
    if (!user) {
        return null;
    }

    const data = user.toObject
        ? user.toObject()
        : { ...user };

    delete data.passwordHash;
    delete data.__v;

    return data;
}

function createAccessToken(user, sessionId) {
    validateTokenConfiguration();

    return jwt.sign(
        {
            sub: user._id.toString(),
            sid: sessionId,
            roles: user.roles || []
        },
        ACCESS_TOKEN_SECRET,
        {
            algorithm: 'HS256',
            expiresIn: ACCESS_TOKEN_TTL,
            issuer: ACCESS_TOKEN_ISSUER,
            audience: ACCESS_TOKEN_AUDIENCE,
            jwtid: crypto.randomUUID()
        }
    );
}

class AuthenticationService {
    constructor(options = {}) {
        this.userRepository =
            options.userRepository || new UserRepository();

        this.sessionService =
            options.sessionService || new SessionService({
                userRepository: this.userRepository
            });
    }

    async register(input, metadata = {}) {
        requireDatabaseConnection();

        const {
            email,
            username,
            fullName,
            password
        } = input || {};

        if (
            typeof email !== 'string' ||
            typeof username !== 'string' ||
            typeof fullName !== 'string' ||
            typeof password !== 'string'
        ) {
            throw new Error('All registration fields are required.');
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim();

        if (
            normalizedEmail.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            throw new Error('A valid email address is required.');
        }

        if (!/^[a-zA-Z0-9_]{3,30}$/.test(normalizedUsername)) {
            throw new Error(
                'Username must contain 3–30 letters, numbers, or underscores.'
            );
        }

        if (fullName.trim().length < 2 || fullName.trim().length > 120) {
            throw new Error('Full name must contain 2–120 characters.');
        }

        if (
            password.length < 12 ||
            Buffer.byteLength(password, 'utf8') > 72
        ) {
            throw new Error(
                'Password must contain at least 12 characters and be no more than 72 UTF-8 bytes.'
            );
        }

        const existingEmail =
            await this.userRepository.findByEmail(normalizedEmail);

        if (existingEmail) {
            throw new Error('Unable to register with those details.');
        }

        const existingUsername =
            await this.userRepository.findByUsername(
                normalizedUsername
            );

        if (existingUsername) {
            throw new Error('Unable to register with those details.');
        }

        const passwordHash = await bcrypt.hash(
            password,
            BCRYPT_ROUNDS
        );

        let user;

        try {
            user = await this.userRepository.create({
                email: normalizedEmail,
                username: normalizedUsername,
                fullName: fullName.trim(),
                passwordHash
            });
        } catch (error) {
            if (error.code === 11000) {
                throw new Error(
                    'Unable to register with those details.'
                );
            }

            throw error;
        }

        /*
         * New accounts remain pending until your existing
         * email-verification workflow activates them.
         */

        return {
            user: sanitizeUser(user),
            requiresEmailVerification: true
        };
    }

    async login(input, metadata = {}) {
        requireDatabaseConnection();

        validateTokenConfiguration();

        const { email, password } = input || {};

        if (
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            throw new Error('Invalid email or password.');
        }

        const user = await this.userRepository.findByEmail(
            email.trim().toLowerCase(),
            {
                includePasswordHash: true
            }
        );

        if (!user || !user.passwordHash) {
            throw new Error('Invalid email or password.');
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            throw new Error('Invalid email or password.');
        }

        if (user.accountStatus !== 'active') {
            throw new Error(
                'This account is not active. Complete verification or contact support.'
            );
        }

        if (!user.emailVerified) {
            throw new Error('Email verification is required.');
        }

        const session = await this.sessionService.createSession(
            user._id,
            metadata
        );

        const accessToken = createAccessToken(
            user,
            session.sessionId
        );

        return {
            user: sanitizeUser(user),
            accessToken,
            refreshToken: session.refreshToken,
            sessionId: session.sessionId,
            accessTokenExpiresIn: ACCESS_TOKEN_TTL,
            refreshTokenExpiresAt: session.expiresAt
        };
    }

    verifyAccessToken(token) {
        validateTokenConfiguration();

        if (typeof token !== 'string' || !token.trim()) {
            throw new Error('Access token is required.');
        }

        return jwt.verify(token, ACCESS_TOKEN_SECRET, {
            algorithms: ['HS256'],
            issuer: ACCESS_TOKEN_ISSUER,
            audience: ACCESS_TOKEN_AUDIENCE
        });
    }

    async refresh(sessionId, refreshToken) {
        requireDatabaseConnection();

        validateTokenConfiguration();

        const session = await this.sessionService
            .validateRefreshToken(sessionId, refreshToken);

        if (!session) {
            throw new Error('Invalid or expired refresh token.');
        }

        const rotated = await this.sessionService
            .rotateRefreshToken(sessionId, refreshToken);

        const accessToken = createAccessToken(
            session.user,
            rotated.sessionId
        );

        return {
            accessToken,
            refreshToken: rotated.refreshToken,
            sessionId: rotated.sessionId,
            accessTokenExpiresIn: ACCESS_TOKEN_TTL,
            refreshTokenExpiresAt: rotated.expiresAt
        };
    }

    async logout(sessionId) {
        requireDatabaseConnection();

        return this.sessionService.revokeSession(sessionId);
    }

    async logoutAll(userId) {
        requireDatabaseConnection();

        return this.sessionService.revokeAllSessions(userId);
    }
}

module.exports = {
    AuthenticationService,
    sanitizeUser
};
