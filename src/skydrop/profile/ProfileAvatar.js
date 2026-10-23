'use strict';

const {
    ProfileValidationError,
    ProfileNotFoundError
} = require('./ProfileErrors');

const {
    requireOwner
} = require('./ProfilePermissions');

const MAX_AVATAR_URL_LENGTH = 2048;

function validateAvatarUrl(url) {
    if (typeof url !== 'string' || !url.trim()) {
        throw new ProfileValidationError(
            'A valid avatar URL is required.'
        );
    }

    if (url.length > MAX_AVATAR_URL_LENGTH) {
        throw new ProfileValidationError(
            'Avatar URL is too long.'
        );
    }

    let parsed;

    try {
        parsed = new URL(url);
    } catch {
        throw new ProfileValidationError(
            'Avatar must be a valid URL.'
        );
    }

    if (!['https:'].includes(parsed.protocol)) {
        throw new ProfileValidationError(
            'Avatar URLs must use HTTPS.'
        );
    }

    if (parsed.username || parsed.password) {
        throw new ProfileValidationError(
            'Avatar URLs cannot contain embedded credentials.'
        );
    }

    return parsed.toString();
}

class ProfileAvatar {
    constructor(repository) {
        this.repository = repository;
    }

    async update(actor, profileId, avatarUrl) {
        const profile = await this.repository.findById(profileId);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        requireOwner(actor, profile);

        const safeUrl = validateAvatarUrl(avatarUrl);

        return this.repository.update(profileId, {
            avatarUrl: safeUrl
        });
    }

    async remove(actor, profileId) {
        const profile = await this.repository.findById(profileId);

        if (!profile) {
            throw new ProfileNotFoundError();
        }

        requireOwner(actor, profile);

        return this.repository.update(profileId, {
            avatarUrl: null
        });
    }
}

module.exports = {
    ProfileAvatar,
    validateAvatarUrl
};
