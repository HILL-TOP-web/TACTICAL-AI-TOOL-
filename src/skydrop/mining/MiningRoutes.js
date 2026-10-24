'use strict';

const express = require('express');

function createMiningRoutes(options = {}) {
    const router = express.Router();

    const MiningService = require('./MiningService');
    const MiningController = require('./MiningController');

    const miningService =
        options.miningService || new MiningService(options);

    const controller =
        new MiningController(miningService);

    const authenticate = options.authenticate;

    if (typeof authenticate !== 'function') {
        throw new Error(
            'Mining routes require authentication middleware.'
        );
    }

    router.post('/start', authenticate, controller.start);
    router.post('/stop', authenticate, controller.stop);
    router.get('/status', authenticate, controller.status);
    router.post('/claim', authenticate, controller.claim);
    router.post('/speed', authenticate, controller.setSpeed);

    return router;
}

module.exports = createMiningRoutes;
