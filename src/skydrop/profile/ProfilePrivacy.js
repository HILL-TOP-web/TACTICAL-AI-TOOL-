'use strict';

const {
    PRIVACY_LEVELS
} = require('./ProfileModel');

const {
    ProfileValidationError
} = require('./ProfileErrors');

const {
    requireOwner,
    canViewProfile
} = require('./ProfilePermissions');

function updatePrivacy(actor, profile, privacy) {
    requireOwner(actor, profile);

    if (!PRIVACY_LEVELS.includes(privacy)) {
        throw new ProfileValidationError(
            'Invalid profile privacy setting.'
        );
    }

    return {
        ...profile,
        privacy,
        updatedAt: new Date().toISOString()
    };
}

function getVisibleFields(actor, profile) {
    if (!canViewProfile(actor, profile)) {
        return null;
    }

    const isOwner = actor &&
        (actor.userId || actor.id) === profile.userId;

    const result = {
        id: profile.id,
        displayName: profile.displayName,
        username: profile.username,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        privacy: profile.privacy
    };

    if (isOwner || profile.privacy === 'public') {
        result.location = profile.location;
        result.website = profile.website;
        result.status = profile.status;
        result.statistics = profile.statistics;
    }

    return result;
}

module.exports = {
    updatePrivacy,
    getVisibleFields
};
