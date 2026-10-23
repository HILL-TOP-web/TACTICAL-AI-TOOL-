'use strict';

const {
    validateSettingsUpdate
} = require('./SettingsValidator');

const {
    requireSettingsOwner
} = require('./SettingsPermissions');

class DisplaySettings {
    constructor(service) {
        this.service = service;
    }

    async get(actor, userId) {
        requireSettingsOwner(actor, userId);

        const settings = await this.service.getForUser(userId);

        return settings.display;
    }

    async update(actor, userId, input) {
        requireSettingsOwner(actor, userId);

        const validated = validateSettingsUpdate({
            display: input
        });

        return this.service.updateForUser(
            userId,
            validated
        );
    }
}

module.exports = {
    DisplaySettings
};
