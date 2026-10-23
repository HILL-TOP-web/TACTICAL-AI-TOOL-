'use strict';

class ProfileError extends Error {
    constructor(message, code = 'PROFILE_ERROR', statusCode = 400) {
        super(message);

        this.name = 'ProfileError';
        this.code = code;
        this.statusCode = statusCode;

        Error.captureStackTrace?.(this, ProfileError);
    }
}

class ProfileNotFoundError extends ProfileError {
    constructor() {
        super('Profile not found.', 'PROFILE_NOT_FOUND', 404);
        this.name = 'ProfileNotFoundError';
    }
}

class ProfileValidationError extends ProfileError {
    constructor(message, details = []) {
        super(message, 'PROFILE_VALIDATION_ERROR', 400);
        this.name = 'ProfileValidationError';
        this.details = details;
    }
}

class ProfileAuthorizationError extends ProfileError {
    constructor() {
        super('You are not authorized to perform this action.', 'PROFILE_FORBIDDEN', 403);
        this.name = 'ProfileAuthorizationError';
    }
}

class ProfileConflictError extends ProfileError {
    constructor(message = 'A profile conflict occurred.') {
        super(message, 'PROFILE_CONFLICT', 409);
        this.name = 'ProfileConflictError';
    }
}

class ProfileConfigurationError extends ProfileError {
    constructor(message = 'Profile configuration is invalid.') {
        super(message, 'PROFILE_CONFIGURATION_ERROR', 500);
        this.name = 'ProfileConfigurationError';
    }
}

module.exports = {
    ProfileError,
    ProfileNotFoundError,
    ProfileValidationError,
    ProfileAuthorizationError,
    ProfileConflictError,
    ProfileConfigurationError
};
