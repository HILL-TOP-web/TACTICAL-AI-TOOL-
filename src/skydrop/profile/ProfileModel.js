'use strict';

const crypto = require('node:crypto');

const PROFILE_STATUSES = Object.freeze([
    'active',
    'pending',
    'suspended',
    'disabled'
]);

const PRIVACY_LEVELS = Object.freeze([
    'public',
    'members',
    'private'
]);

function createProfile(input = {}) {
    const now = new Date().toISOString();

    return {
        id: input.id || crypto.randomUUID(),
        userId: input.userId || null,

        displayName: input.displayName || '',
        username: input.username || '',
        bio: input.bio || '',
        avatarUrl: input.avatarUrl || null,

        location: input.location || '',
        website: input.website || '',

        privacy: input.privacy || 'members',
        status: input.status || 'pending',

        verified: Boolean(input.verified),
        verificationStatus: input.verificationStatus || 'unverified',

        createdAt: input.createdAt || now,
        updatedAt: input.updatedAt || now,

        lastActiveAt: input.lastActiveAt || null,

        statistics: {
            followers: 0,
            following: 0,
            posts: 0,
            ...(input.statistics || {})
        }
    };
}

function validateProfileShape(profile) {
    if (!profile || typeof profile !== 'object') {
        return false;
    }

    if (typeof profile.id !== 'string' || !profile.id) {
        return false;
    }

    if (typeof profile.userId !== 'string' || !profile.userId) {
        return false;
    }

    if (!PROFILE_STATUSES.includes(profile.status)) {
        return false;
    }

    if (!PRIVACY_LEVELS.includes(profile.privacy)) {
        return false;
    }

    return true;
}

module.exports = {
    createProfile,
    validateProfileShape,
    PROFILE_STATUSES,
    PRIVACY_LEVELS
};
