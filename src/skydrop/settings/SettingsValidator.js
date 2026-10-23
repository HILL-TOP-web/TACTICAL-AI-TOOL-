'use strict';

const {
    SettingsValidationError
} = require('./SettingsErrors');

const ALLOWED_SETTINGS = Object.freeze({
    account: {
        displayName: 'string',
        language: 'string',
        timezone: 'string'
    },

    privacy: {
        profileVisibility: ['public', 'members', 'private'],
        showOnlineStatus: 'boolean',
        showActivityStatus: 'boolean',
        allowMessagesFrom: ['everyone', 'members', 'nobody'],
        searchableByUsername: 'boolean'
    },

    security: {
        twoFactorEnabled: 'boolean',
        loginAlertsEnabled: 'boolean',
        suspiciousActivityAlertsEnabled: 'boolean'
    },

    notifications: {
        emailEnabled: 'boolean',
        pushEnabled: 'boolean',
        marketingEnabled: 'boolean',
        transactionAlertsEnabled: 'boolean',
        securityAlertsEnabled: 'boolean',
        socialAlertsEnabled: 'boolean',
        miningAlertsEnabled: 'boolean'
    },

    display: {
        theme: ['light', 'dark', 'system'],
        compactMode: 'boolean',
        showBalances: 'boolean',
        currency: ['NGN', 'USD', 'GBP', 'EUR']
    },

    accessibility: {
        reducedMotion: 'boolean',
        highContrast: 'boolean',
        largeText: 'boolean',
        screenReaderOptimized: 'boolean'
    },

    session: {
        sessionTimeoutMinutes: 'number',
        notifyOnNewLogin: 'boolean'
    }
});

const MAX_TEXT_LENGTH = 100;

function validateValue(section, field, value) {
    const rule = ALLOWED_SETTINGS[section]?.[field];

    if (!rule) {
        throw new SettingsValidationError(
            `Unsupported setting: ${section}.${field}`
        );
    }

    if (Array.isArray(rule)) {
        if (!rule.includes(value)) {
            throw new SettingsValidationError(
                `Invalid value for ${section}.${field}.`
            );
        }

        return value;
    }

    if (rule === 'boolean') {
        if (typeof value !== 'boolean') {
            throw new SettingsValidationError(
                `${section}.${field} must be a boolean.`
            );
        }

        return value;
    }

    if (rule === 'number') {
        if (
            !Number.isInteger(value) ||
            value < 5 ||
            value > 1440
        ) {
            throw new SettingsValidationError(
                `${section}.${field} must be between 5 and 1440 minutes.`
            );
        }

        return value;
    }

    if (rule === 'string') {
        if (
            typeof value !== 'string' ||
            value.length > MAX_TEXT_LENGTH ||
            value.includes('\0')
        ) {
            throw new SettingsValidationError(
                `Invalid string value for ${section}.${field}.`
            );
        }

        const normalized = value.trim();

        if (!normalized) {
            throw new SettingsValidationError(
                `${section}.${field} cannot be empty.`
            );
        }

        if (
            section === 'account' &&
            field === 'language' &&
            !/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(normalized)
        ) {
            throw new SettingsValidationError(
                'Language must be a supported locale code.'
            );
        }

        if (
            section === 'account' &&
            field === 'timezone'
        ) {
            try {
                new Intl.DateTimeFormat('en', {
                    timeZone: normalized
                });
            } catch {
                throw new SettingsValidationError(
                    'Invalid timezone.'
                );
            }
        }

        return normalized;
    }

    throw new SettingsValidationError(
        `Unsupported validation rule for ${section}.${field}.`
    );
}

function validateSettingsUpdate(input) {
    if (
        !input ||
        typeof input !== 'object' ||
        Array.isArray(input)
    ) {
        throw new SettingsValidationError(
            'Settings must be provided as an object.'
        );
    }

    const sections = Object.keys(input);

    if (sections.length === 0) {
        throw new SettingsValidationError(
            'Provide at least one setting to update.'
        );
    }

    const result = {};

    for (const section of sections) {
        if (!Object.hasOwn(ALLOWED_SETTINGS, section)) {
            throw new SettingsValidationError(
                `Unsupported settings section: ${section}`
            );
        }

        const values = input[section];

        if (
            !values ||
            typeof values !== 'object' ||
            Array.isArray(values)
        ) {
            throw new SettingsValidationError(
                `${section} must be an object.`
            );
        }

        const fields = Object.keys(values);

        if (fields.length === 0) {
            throw new SettingsValidationError(
                `${section} cannot be empty.`
            );
        }

        result[section] = {};

        for (const field of fields) {
            result[section][field] = validateValue(
                section,
                field,
                values[field]
            );
        }
    }

    return result;
}

module.exports = {
    validateSettingsUpdate,
    validateValue,
    ALLOWED_SETTINGS
};
