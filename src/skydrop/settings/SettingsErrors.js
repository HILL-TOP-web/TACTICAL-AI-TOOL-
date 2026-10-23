'use strict';

class SettingsError extends Error {
    constructor(
        message,
        code = 'SETTINGS_ERROR',
        statusCode = 400
    ) {
        super(message);

        this.name = 'SettingsError';
        this.code = code;
        this.statusCode = statusCode;

        Error.captureStackTrace?.(this, SettingsError);
    }
}

class SettingsNotFoundError extends SettingsError {
    constructor() {
        super(
            'Settings not found.',
            'SETTINGS_NOT_FOUND',
            404
        );

        this.name = 'SettingsNotFoundError';
    }
}

class SettingsValidationError extends SettingsError {
    constructor(message, details = []) {
        super(
            message,
            'SETTINGS_VALIDATION_ERROR',
            400
        );

        this.name = 'SettingsValidationError';
        this.details = details;
    }
}

class SettingsAuthorizationError extends SettingsError {
    constructor() {
        super(
            'You are not authorized to modify these settings.',
            'SETTINGS_FORBIDDEN',
            403
        );

        this.name = 'SettingsAuthorizationError';
    }
}

class SettingsConflictError extends SettingsError {
    constructor(message = 'A settings conflict occurred.') {
        super(
            message,
            'SETTINGS_CONFLICT',
            409
        );

        this.name = 'SettingsConflictError';
    }
}

module.exports = {
    SettingsError,
    SettingsNotFoundError,
    SettingsValidationError,
    SettingsAuthorizationError,
    SettingsConflictError
};
