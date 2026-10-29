'use strict';

const AuthConfig = require('./AuthConfig');

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function validateEmail(email) {
    if (typeof email !== 'string') {
        return false;
    }

    if (email.length > 254) {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    if (typeof password !== 'string') {
        return false;
    }

    if (
        password.length < AuthConfig.passwordMinLength ||
        password.length > 128
    ) {
        return false;
    }

    return true;
}

function validateRegistration(input) {
    const errors = [];

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return {
            valid: false,
            errors: ['A registration object is required.']
        };
    }

    const name =
        typeof input.name === 'string'
            ? input.name.trim()
            : '';

    const email = normalizeEmail(input.email);
    const password = input.password;

    if (name.length < 2 || name.length > 80) {
        errors.push('Name must contain between 2 and 80 characters.');
    }

    if (!validateEmail(email)) {
        errors.push('A valid email address is required.');
    }

    if (!validatePassword(password)) {
        errors.push(
            `Password must contain between ${AuthConfig.passwordMinLength} and 128 characters.`
        );
    }

    return {
        valid: errors.length === 0,
        errors,
        data: {
            name,
            email,
            password
        }
    };
}

function validateLogin(input) {
    const errors = [];

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return {
            valid: false,
            errors: ['A login object is required.']
        };
    }

    const email = normalizeEmail(input.email);
    const password = input.password;

    if (!validateEmail(email)) {
        errors.push('A valid email address is required.');
    }

    if (
        typeof password !== 'string' ||
        password.length === 0 ||
        password.length > 128
    ) {
        errors.push('A valid password is required.');
    }

    return {
        valid: errors.length === 0,
        errors,
        data: {
            email,
            password
        }
    };
}

module.exports = {
    normalizeEmail,
    validateEmail,
    validatePassword,
    validateRegistration,
    validateLogin
};
