'use strict';

const {
    createSettings
} = require('./SettingsModel');

const {
    SettingsConflictError
} = require('./SettingsErrors');

function clone(value) {
    return structuredClone(value);
}

function mergePreferences(current, changes) {
    const result = clone(current);

    for (const [section, values] of Object.entries(changes)) {
        result[section] = {
            ...result[section],
            ...values
        };
    }

    return result;
}

class SettingsRepository {
    constructor() {
        this.records = new Map();
        this.userIndex = new Map();
    }

    async create(userId, preferences = {}) {
        if (this.userIndex.has(userId)) {
            throw new SettingsConflictError(
                'Settings already exist for this user.'
            );
        }

        const settings = createSettings({
            userId,
            preferences
        });

        this.records.set(settings.id, settings);
        this.userIndex.set(userId, settings.id);

        return clone(settings);
    }

    async findByUserId(userId) {
        const id = this.userIndex.get(userId);

        if (!id) {
            return null;
        }

        const settings = this.records.get(id);

        return settings ? clone(settings) : null;
    }

    async updateByUserId(userId, changes, expectedVersion) {
        const id = this.userIndex.get(userId);

        if (!id) {
            return null;
        }

        const existing = this.records.get(id);

        if (
            expectedVersion !== undefined &&
            existing.version !== expectedVersion
        ) {
            throw new SettingsConflictError(
                'Settings have changed. Refresh and try again.'
            );
        }

        const updatedPreferences = mergePreferences(
            existing,
            changes
        );

        const updated = {
            ...updatedPreferences,
            id: existing.id,
            userId: existing.userId,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
            version: existing.version + 1
        };

        this.records.set(id, updated);

        return clone(updated);
    }

    async deleteByUserId(userId) {
        const id = this.userIndex.get(userId);

        if (!id) {
            return false;
        }

        this.records.delete(id);
        this.userIndex.delete(userId);

        return true;
    }
}

module.exports = {
    SettingsRepository
};
