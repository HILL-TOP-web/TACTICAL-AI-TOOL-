'use strict';

const express = require('express');

const {
    SettingsService
} = require('./SettingsService');

const {
    createSettingsController
} = require('./SettingsController');

const {
    SettingsValidationError
} = require('./SettingsErrors');

function createSettingsRoutes(options = {}) {
    const router = express.Router();

    const service =
        options.service || new SettingsService();

    const controller = createSettingsController(service);

    const authenticate = options.authenticate;

    if (typeof authenticate !== 'function') {
        throw new TypeError(
            'SettingsRoutes requires authentication middleware.'
        );
    }

    router.use(authenticate);

    router.use(express.json({
        limit: '16kb',
        strict: true
    }));

    router.get(
        '/',
        controller.get
    );

    router.patch(
        '/',
        controller.update
    );

    router.post(
        '/reset',
        controller.reset
    );

    // Convert malformed JSON into a consistent error response.
    router.use((error, req, res, next) => {
        if (error instanceof SyntaxError && error.status === 400) {
            return next(
                new SettingsValidationError(
                    'The request body contains invalid JSON.'
                )
            );
        }

        return next(error);
    });

    return router;
}

module.exports = {
    createSettingsRoutes
};
