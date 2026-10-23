'use strict';

const crypto = require('node:crypto');

const {
    cloneDefaults
} = require('./SettingsDefaults');

function createSettings(input = {}) {
    if (
        typeof input.userId !== 'string' ||
        !input.userId.trim()
    ) {
        throw new TypeError(
            'A valid userId is required.'
        );
    }

    const now = new Date().toISOString();

    return {
        id: input.id || crypto.randomUUID(),

        userId: input.userId,

        ...cloneDefaults(),

        ...(input.preferences || {}),

        createdAt: input.createdAt || now,
        updatedAt: input.updatedAt || now,

        version: Number.isSafeInteger(input.version)
            ? input.version
            : 1
    };
}

function validateSettingsShape(settings) {
    return Boolean(
        settings &&
        typeof settings === 'object' &&
        typeof settings.id === 'string' &&
        typeof settings.userId === 'string' &&
        settings.account &&
        settings.privacy &&
        settings.security &&
        settings.notifications &&
        settings.display &&
        settings.accessibility &&
        settings.session
    );
}

module.exports = {
    createSettings,
    validateSettingsShape
};
