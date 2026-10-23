'use strict';

const express = require('express');

const {
    ProfileService
} = require('./ProfileService');

const {
    createProfileController
} = require('./ProfileController');

function createProfileRoutes(options = {}) {
    const router = express.Router();

    const service =
        options.service || new ProfileService();

    const controller = createProfileController(service);

    // Supply the actual authentication middleware from
    // tactical-ai/src/skydrop-access or your existing auth module.
    const authenticate = options.authenticate;

    if (typeof authenticate !== 'function') {
        throw new TypeError(
            'ProfileRoutes requires an authentication middleware.'
        );
    }

    router.use(authenticate);

    router.get(
        '/:profileId',
        controller.getById
    );

    router.get(
        '/username/:username',
        controller.getByUsername
    );

    router.patch(
        '/:profileId',
        express.json({ limit: '16kb' }),
        controller.update
    );

    router.put(
        '/:profileId/avatar',
        express.json({ limit: '8kb' }),
        controller.updateAvatar
    );

    router.delete(
        '/:profileId/avatar',
        controller.removeAvatar
    );

    router.patch(
        '/:profileId/privacy',
        express.json({ limit: '8kb' }),
        controller.updatePrivacy
    );

    router.get(
        '/:profileId/statistics',
        controller.getStatistics
    );

    router.get(
        '/:profileId/activity',
        controller.getActivity
    );

    return router;
}

module.exports = {
    createProfileRoutes
};
