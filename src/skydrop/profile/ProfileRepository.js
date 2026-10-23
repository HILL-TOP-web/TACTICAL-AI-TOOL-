'use strict';

const {
    createProfile
} = require('./ProfileModel');

const {
    ProfileConflictError
} = require('./ProfileErrors');

class ProfileRepository {
    constructor() {
        this.profiles = new Map();
        this.userIndex = new Map();
    }

    async create(input) {
        if (!input || typeof input.userId !== 'string' || !input.userId) {
            throw new TypeError('A valid userId is required.');
        }

        if (this.userIndex.has(input.userId)) {
            throw new ProfileConflictError(
                'This user already has a profile.'
            );
        }

        const profile = createProfile(input);

        this.profiles.set(profile.id, profile);
        this.userIndex.set(profile.userId, profile.id);

        return structuredClone(profile);
    }

    async findById(id) {
        const profile = this.profiles.get(id);

        return profile ? structuredClone(profile) : null;
    }

    async findByUserId(userId) {
        const profileId = this.userIndex.get(userId);

        if (!profileId) {
            return null;
        }

        return this.findById(profileId);
    }

    async findByUsername(username) {
        const normalized = String(username).toLowerCase();

        for (const profile of this.profiles.values()) {
            if (profile.username === normalized) {
                return structuredClone(profile);
            }
        }

        return null;
    }

    async update(id, changes) {
        const existing = this.profiles.get(id);

        if (!existing) {
            return null;
        }

        if (
            changes.username &&
            changes.username !== existing.username
        ) {
            const conflict = await this.findByUsername(
                changes.username
            );

            if (conflict && conflict.id !== id) {
                throw new ProfileConflictError(
                    'That username is already taken.'
                );
            }
        }

        const updated = {
            ...existing,
            ...changes,
            id: existing.id,
            userId: existing.userId,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString()
        };

        this.profiles.set(id, updated);

        return structuredClone(updated);
    }

    async delete(id) {
        const existing = this.profiles.get(id);

        if (!existing) {
            return false;
        }

        this.profiles.delete(id);
        this.userIndex.delete(existing.userId);

        return true;
    }

    async list({ limit = 20, offset = 0 } = {}) {
        const profiles = Array.from(this.profiles.values());

        return profiles
            .slice(offset, offset + limit)
            .map(profile => structuredClone(profile));
    }

    async count() {
        return this.profiles.size;
    }
}

module.exports = {
    ProfileRepository
};
