'use strict';

const {
    ProfileValidationError
} = require('./ProfileErrors');

const {
    PROFILE_STATUSES,
    PRIVACY_LEVELS
} = require('./ProfileModel');

const ALLOWED_FIELDS = Object.freeze([
    'displayName',
    'username',
    'bio',
    'location',
    'website',
    'privacy'
]);

function validateString(value, field, maxLength) {
    if (typeof value !== 'string') {
        throw new ProfileValidationError(
            `${field} must be a string.`
        );
    }

    if (value.length > maxLength) {
        throw new ProfileValidationError(
            `${field} cannot exceed ${maxLength} characters.`
        );
    }

    if (value.includes('\0')) {
        throw new ProfileValidationError(
            `${field} contains an invalid character.`
        );
    }

    return value.trim();
}

function validateProfileUpdate(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new ProfileValidationError(
            'Profile update must be an object.'
        );
    }

    const keys = Object.keys(input);

    if (keys.length === 0) {
        throw new ProfileValidationError(
            'Provide at least one field to update.'
        );
    }

    const unknownFields = keys.filter(
        key => !ALLOWED_FIELDS.includes(key)
    );

    if (unknownFields.length > 0) {
        throw new ProfileValidationError(
            `Unsupported profile fields: ${unknownFields.join(', ')}`
        );
    }

    const result = {};

    if (Object.hasOwn(input, 'displayName')) {
        result.displayName = validateString(
            input.displayName,
            'displayName',
            80
        );

        if (!result.displayName) {
            throw new ProfileValidationError(
                'Display name cannot be empty.'
            );
        }
    }

    if (Object.hasOwn(input, 'username')) {
        result.username = validateString(
            input.username,
            'username',
            30
        ).toLowerCase();

        if (!/^[a-z0-9_]{3,30}$/.test(result.username)) {
            throw new ProfileValidationError(
                'Username must contain 3–30 letters, numbers, or underscores.'
            );
        }
    }

    if (Object.hasOwn(input, 'bio')) {
        result.bio = validateString(
            input.bio,
            'bio',
            500
        );
    }

    if (Object.hasOwn(input, 'location')) {
        result.location = validateString(
            input.location,
            'location',
            100
        );
    }

    if (Object.hasOwn(input, 'website')) {
        result.website = validateString(
            input.website,
            'website',
            2048
        );

        if (result.website) {
            let parsed;

            try {
                parsed = new URL(result.website);
            } catch {
                throw new ProfileValidationError(
                    'Website must be a valid URL.'
                );
            }

            if (!['http:', 'https:'].includes(parsed.protocol)) {
                throw new ProfileValidationError(
                    'Website must use HTTP or HTTPS.'
                );
            }

            result.website = parsed.toString();
        }
    }

    if (Object.hasOwn(input, 'privacy')) {
        if (!PRIVACY_LEVELS.includes(input.privacy)) {
            throw new ProfileValidationError(
                'Invalid privacy setting.'
            );
        }

        result.privacy = input.privacy;
    }

    return result;
}

function validateProfileStatus(status) {
    if (!PROFILE_STATUSES.includes(status)) {
        throw new ProfileValidationError(
            'Invalid profile status.'
        );
    }

    return status;
}

function validateProfileId(id) {
    if (typeof id !== 'string' || !id.trim()) {
        throw new ProfileValidationError(
            'A valid profile ID is required.'
        );
    }

    return id.trim();
}

module.exports = {
    validateProfileUpdate,
    validateProfileStatus,
    validateProfileId,
    ALLOWED_FIELDS
};
