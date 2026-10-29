'use strict';

const jwt = require('jsonwebtoken');
const AuthConfig = require('./AuthConfig');

function createAccessToken(user) {
    const secret = AuthConfig.getJwtSecret();

    return jwt.sign(
        {
            email: user.email
        },
        secret,
        {
            subject: String(user._id),
            issuer: 'skydrop',
            audience: 'skydrop-api',
            expiresIn: AuthConfig.jwtExpiresIn,
            algorithm: 'HS256'
        }
    );
}

function verifyAccessToken(token) {
    if (typeof token !== 'string' || !token.trim()) {
        throw new Error('Access token is required.');
    }

    return jwt.verify(
        token,
        AuthConfig.getJwtSecret(),
        {
            issuer: 'skydrop',
            audience: 'skydrop-api',
            algorithms: ['HS256']
        }
    );
}

module.exports = {
    createAccessToken,
    verifyAccessToken
};
