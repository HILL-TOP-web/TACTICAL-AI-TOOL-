'use strict';

const express = require('express');

const AuthController = require('./AuthController');
const AuthMiddleware = require('./AuthMiddleware');
const AuthRateLimiter = require('./AuthRateLimiter');

const router = express.Router();

router.post(
    '/register',
    AuthRateLimiter,
    AuthController.register
);

router.post(
    '/login',
    AuthRateLimiter,
    AuthController.login
);

router.get(
    '/me',
    AuthMiddleware.requireAuth,
    AuthController.me
);

router.post(
    '/logout',
    AuthMiddleware.requireAuth,
    AuthController.logout
);

module.exports = router;
