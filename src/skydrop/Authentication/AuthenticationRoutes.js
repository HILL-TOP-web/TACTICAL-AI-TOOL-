'use strict';

const express = require('express');

const rateLimit = require('express-rate-limit');

const {
    createAuthenticationController
} = require('./AuthenticationController');

const {
    authenticate
} = require('./AuthenticationMiddleware');

function createAuthenticationRoutes(options = {}) {
    const router = express.Router();

    const controller =
        options.controller ||
        createAuthenticationController();

    const authenticationMiddleware =
        options.authenticate || authenticate;

    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
            success: false,
            error: {
                code: 'LOGIN_RATE_LIMITED',
                message: 'Too many authentication attempts. Please try again later.'
            }
        }
    });

    const registrationLimiter = rateLimit({
        windowMs: 60 * 60 * 1000,
        limit: 5,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
            success: false,
            error: {
                code: 'REGISTRATION_RATE_LIMITED',
                message: 'Too many registration attempts. Please try again later.'
            }
        }
    });

    const refreshLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 20,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
            success: false,
            error: {
                code: 'REFRESH_RATE_LIMITED',
                message: 'Too many refresh attempts. Please try again later.'
            }
        }
    });

    router.post(
        '/register',
        registrationLimiter,
        controller.register
    );

    router.post(
        '/login',
        loginLimiter,
        controller.login
    );

    router.post(
        '/refresh',
        refreshLimiter,
        controller.refresh
    );

    router.post(
        '/logout',
        authenticationMiddleware,
        controller.logout
    );

    router.post(
        '/logout-all',
        authenticationMiddleware,
        controller.logoutAll
    );

    return router;
}

module.exports = {
    createAuthenticationRoutes
};
