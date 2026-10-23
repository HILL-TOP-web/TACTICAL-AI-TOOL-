'use strict';

const {
    ProfileNotFoundError
} = require('./ProfileErrors');

const {
    requireOwner
} = require('./ProfilePermissions');

class ProfileActivity {
    constructor(repository) {
        this.repository = repository;
        this.activities = new Map();
    }

    async record(actor, profileId, activityType) {
        const profile = await this.repository.findById(profileId);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        requireOwner(actor, profile);

        const allowedTypes = [
            'profile_view',
            'profile_updated',
            'avatar_updated',
            'privacy_updated',
            'login'
        ];

        if (!allowedTypes.includes(activityType)) {
            throw new TypeError('Unsupported profile activity.');
        }

        const existing = this.activities.get(profileId) || [];

        const entry = {
            type: activityType,
            timestamp: new Date().toISOString()
        };

        existing.push(entry);

        // Keep a bounded, in-memory development history.
        if (existing.length > 100) {
            existing.splice(0, existing.length - 100);
        }

        this.activities.set(profileId, existing);

        await this.repository.update(profileId, {
            lastActiveAt: entry.timestamp
        });

        return { ...entry };
    }

    async getOwnActivity(actor, profileId) {
        const profile = await this.repository.findById(profileId);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        requireOwner(actor, profile);

        return (this.activities.get(profileId) || [])
            .map(item => ({ ...item }));
    }
}

module.exports = {
    ProfileActivity
};
