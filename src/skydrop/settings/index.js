'use strict';

const {
    createSettings,
    validateSettingsShape
} = require('./SettingsModel');

const {
    SettingsService
} = require('./SettingsService');

const {
    SettingsRepository
} = require('./SettingsRepository');

const {
    validateSettingsUpdate,
    validateValue,
    ALLOWED_SETTINGS
} = require('./SettingsValidator');

const {
    AccountSettings
} = require('./AccountSettings');

const {
    PrivacySettings
} = require('./PrivacySettings');

const {
    SecuritySettings
} = require('./SecuritySettings');

const {
    NotificationSettings
} = require('./NotificationSettings');

const {
    DisplaySettings
} = require('./DisplaySettings');

const {
    LanguageSettings,
    SUPPORTED_LANGUAGES
} = require('./LanguageSettings');

const {
    AccessibilitySettings
} = require('./AccessibilitySettings');

const {
    SessionSettings
} = require('./SessionSettings');

const {
    DEFAULT_SETTINGS,
    cloneDefaults
} = require('./SettingsDefaults');

const {
    createSettingsController
} = require('./SettingsController');

const {
    createSettingsRoutes
} = require('./SettingsRoutes');

const SettingsPermissions = require('./SettingsPermissions');
const SettingsErrors = require('./SettingsErrors');

module.exports = {
    createSettings,
    validateSettingsShape,

    SettingsService,
    SettingsRepository,

    AccountSettings,
    PrivacySettings,
    SecuritySettings,
    NotificationSettings,
    DisplaySettings,
    LanguageSettings,
    AccessibilitySettings,
    SessionSettings,

    validateSettingsUpdate,
    validateValue,
    ALLOWED_SETTINGS,

    DEFAULT_SETTINGS,
    cloneDefaults,
    SUPPORTED_LANGUAGES,

    createSettingsController,
    createSettingsRoutes,

    SettingsPermissions,
    SettingsErrors
};
