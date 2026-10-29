'use strict';

const bcrypt = require('bcryptjs');
const AuthConfig = require('./AuthConfig');

async function hashPassword(password) {
    if (typeof password !== 'string' || password.length > 128) {
        throw new Error('Invalid password.');
    }

    return bcrypt.hash(password, AuthConfig.bcryptRounds);
}

async function verifyPassword(password, passwordHash) {
    if (
        typeof password !== 'string' ||
        typeof passwordHash !== 'string'
    ) {
        return false;
    }

    try {
        return await bcrypt.compare(password, passwordHash);
    } catch {
        return false;
    }
}

module.exports = {
    hashPassword,
    verifyPassword
};
