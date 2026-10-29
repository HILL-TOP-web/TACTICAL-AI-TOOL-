'use strict';

const AuthService = require('./AuthService');

function handleError(res, error) {
    const statusCode = error.statusCode || 500;

    if (statusCode >= 500) {
        console.error('SkyDrop authentication request failed.');
    }

    return res.status(statusCode).json({
        success: false,
        error: statusCode >= 500
            ? 'An internal server error occurred.'
            : error.message
    });
}

async function register(req, res) {
    try {
        const result = await AuthService.register(req.body);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
}

async function login(req, res) {
    try {
        const result = await AuthService.login(req.body);

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
}

async function me(req, res) {
    try {
        const user = await AuthService.getCurrentUser(
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        return handleError(res, error);
    }
}

async function logout(req, res) {
    // JWTs remain valid until expiry unless revocation
    // is implemented and checked by the authentication middleware.
    return res.status(200).json({
        success: true,
        message: 'Logout acknowledged. Remove the access token from the client.'
    });
}

module.exports = {
    register,
    login,
    me,
    logout
};
