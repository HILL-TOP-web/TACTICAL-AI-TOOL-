'use strict';

const {
    validateSettingsUpdate
} = require('./SettingsValidator');

const {
    requireSettingsOwner
} = require('./SettingsPermissions');

class NotificationSettings {
    constructor(service) {
        this.service = service;
    }

    async get(actor, userId) {
        requireSettingsOwner(actor, userId);

        const settings = await this.service.getForUser(userId);

        return settings.notifications;
    }

    async update(actor, userId, input) {
        requireSettingsOwner(actor, userId);

        const validated = validateSettingsUpdate({
            notifications: input
        });

        return this.service.updateForUser(
            userId,
            validated
        );
    }

    async isEnabled(userId, notificationType) {
        const settings = await this.service.getForUser(userId);

        const key = `${notificationType}AlertsEnabled`;

        if (
            Object.hasOwn(settings.notifications, key)
        ) {
            return settings.notifications[key] === true;
        }

        return false;
    }
}

module.exports = {
    NotificationSettings
};
