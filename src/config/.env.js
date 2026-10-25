'use strict';

const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

// ==================================================
// TACTICAL AI — SHARED ENVIRONMENT CONFIGURATION
// ==================================================

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const ENV_PATH = path.join(PROJECT_ROOT, '.env');

const PRODUCTION_MONNIFY_URL = 'https://api.monnify.com';

const errors = [];
const warnings = [];

let envFileLoaded = false;

// ==================================================
// BASIC HELPERS
// ==================================================

function isNonEmpty(value) {
    return typeof value === 'string' &&
        value.trim().length > 0;
}

function readString(value, fallback = '') {
    if (!isNonEmpty(value)) {
        return fallback;
    }

    return value.trim();
}

function readBoolean(value, name, fallback) {
    if (!isNonEmpty(value)) {
        return fallback;
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') {
        return true;
    }

    if (normalized === 'false') {
        return false;
    }

    errors.push(`${name} must be either true or false.`);

    return fallback;
}

function readInteger(value, name, options = {}) {
    const {
        fallback,
        minimum = Number.MIN_SAFE_INTEGER,
        maximum = Number.MAX_SAFE_INTEGER
    } = options;

    if (!isNonEmpty(value)) {
        return fallback;
    }

    const parsed = Number(value);

    if (
        !Number.isSafeInteger(parsed) ||
        parsed < minimum ||
        parsed > maximum
    ) {
        errors.push(
            `${name} must be an integer between ${minimum} and ${maximum}.`
        );

        return fallback;
    }

    return parsed;
}

function addRequiredError(name) {
    errors.push(`${name} is missing or empty.`);
}

function requireValue(env, name) {
    if (!isNonEmpty(env[name])) {
        addRequiredError(name);
        return false;
    }

    return true;
}

// ==================================================
// LOAD ENVIRONMENT VARIABLES
// ==================================================

function loadEnvironment() {
    if (fs.existsSync(ENV_PATH)) {
        try {
            const result = dotenv.config({
                path: ENV_PATH,
                override: false,
                quiet: true
            });

            if (result.error) {
                errors.push(
                    'The local .env file exists but could not be loaded.'
                );
            } else {
                envFileLoaded = true;
            }
        } catch {
            errors.push(
                'The local .env file could not be loaded.'
            );
        }
    }

    // Render and the shell supply variables through process.env.
    // Existing process values take precedence over local .env values.
    return {
        ...process.env
    };
}

// ==================================================
// ENVIRONMENT VALIDATION
// ==================================================

function validateEnvironment(rawEnv) {
    const nodeEnv = readString(
        rawEnv.NODE_ENV,
        'development'
    );

    const allowedNodeEnvironments = [
        'development',
        'test',
        'production'
    ];

    if (!allowedNodeEnvironments.includes(nodeEnv)) {
        errors.push(
            'NODE_ENV must be development, test, or production.'
        );
    }

    const port = readInteger(
        rawEnv.PORT,
        'PORT',
        {
            fallback: 3000,
            minimum: 1,
            maximum: 65535
        }
    );

    const appName = readString(
        rawEnv.APP_NAME,
        'Tactical AI'
    );

    const validationEnabled = readBoolean(
        rawEnv.ENV_VALIDATION_ENABLED,
        'ENV_VALIDATION_ENABLED',
        true
    );

    // Keep validation mandatory in production.
    if (
        nodeEnv === 'production' &&
        !validationEnabled
    ) {
        errors.push(
            'ENV_VALIDATION_ENABLED cannot be false in production.'
        );
    }

    // ----------------------------------------------
    // SKYDROP WITHDRAWAL CONFIGURATION
    // ----------------------------------------------

    const withdrawalsEnabled = readBoolean(
        rawEnv.SKYDROP_WITHDRAWALS_ENABLED,
        'SKYDROP_WITHDRAWALS_ENABLED',
        false
    );

    const bankWithdrawalsEnabled = readBoolean(
        rawEnv.SKYDROP_BANK_WITHDRAWALS_ENABLED,
        'SKYDROP_BANK_WITHDRAWALS_ENABLED',
        false
    );

    const monnifyEnabled = readBoolean(
        rawEnv.MONNIFY_ENABLED,
        'MONNIFY_ENABLED',
        false
    );

    const minimumWithdrawalNgn = readInteger(
        rawEnv.SKYDROP_MIN_WITHDRAWAL_NGN,
        'SKYDROP_MIN_WITHDRAWAL_NGN',
        {
            fallback: 100,
            minimum: 1,
            maximum: Number.MAX_SAFE_INTEGER
        }
    );

    if (minimumWithdrawalNgn !== 100) {
        errors.push(
            'SKYDROP_MIN_WITHDRAWAL_NGN must be 100 NGN.'
        );
    }

    // No application-level maximum is permitted.
    if (
        Object.prototype.hasOwnProperty.call(
            rawEnv,
            'SKYDROP_MAX_WITHDRAWAL_NGN'
        )
    ) {
        errors.push(
            'Remove SKYDROP_MAX_WITHDRAWAL_NGN. ' +
            'SkyDrop must not configure an application-level maximum.'
        );
    }

    // ----------------------------------------------
    // MONNIFY CONFIGURATION
    // ----------------------------------------------

    const monnifyBaseUrl = readString(
        rawEnv.MONNIFY_BASE_URL,
        ''
    );

    const monnifyApiKey = readString(
        rawEnv.MONNIFY_API_KEY,
        ''
    );

    const monnifySecretKey = readString(
        rawEnv.MONNIFY_SECRET_KEY,
        ''
    );

    const monnifyContractCode = readString(
        rawEnv.MONNIFY_CONTRACT_CODE,
        ''
    );

    const monnifyDisbursementPath = readString(
        rawEnv.MONNIFY_DISBURSEMENT_PATH,
        ''
    );

    const monnifyRequestTimeoutMs = readInteger(
        rawEnv.MONNIFY_REQUEST_TIMEOUT_MS,
        'MONNIFY_REQUEST_TIMEOUT_MS',
        {
            fallback: 30000,
            minimum: 1000,
            maximum: 120000
        }
    );

    if (monnifyEnabled) {
        requireValue(rawEnv, 'MONNIFY_BASE_URL');
        requireValue(rawEnv, 'MONNIFY_API_KEY');
        requireValue(rawEnv, 'MONNIFY_SECRET_KEY');
        requireValue(rawEnv, 'MONNIFY_CONTRACT_CODE');
        requireValue(rawEnv, 'MONNIFY_DISBURSEMENT_PATH');

        if (isNonEmpty(monnifyBaseUrl)) {
            try {
                const parsed = new URL(monnifyBaseUrl);

                if (
                    parsed.protocol !== 'https:' ||
                    parsed.username ||
                    parsed.password ||
                    parsed.search ||
                    parsed.hash
                ) {
                    errors.push(
                        'MONNIFY_BASE_URL must be a valid HTTPS base URL.'
                    );
                }

                if (
                    parsed.href.replace(/\/+$/, '') !==
                    PRODUCTION_MONNIFY_URL
                ) {
                    errors.push(
                        'MONNIFY_BASE_URL must be ' +
                        PRODUCTION_MONNIFY_URL
                    );
                }
            } catch {
                errors.push(
                    'MONNIFY_BASE_URL must be a valid HTTPS URL.'
                );
            }
        }

        if (isNonEmpty(monnifyDisbursementPath)) {
            if (
                !monnifyDisbursementPath.startsWith('/') ||
                monnifyDisbursementPath.startsWith('//') ||
                /^https?:\/\//i.test(monnifyDisbursementPath)
            ) {
                errors.push(
                    'MONNIFY_DISBURSEMENT_PATH must be a relative API path ' +
                    'beginning with exactly one slash.'
                );
            }
        }
    }

    // ----------------------------------------------
    // WITHDRAWAL SAFETY CHECKS
    // ----------------------------------------------

    if (
        withdrawalsEnabled &&
        !monnifyEnabled &&
        !bankWithdrawalsEnabled
    ) {
        errors.push(
            'SkyDrop withdrawals are enabled, but no withdrawal provider is enabled.'
        );
    }

    if (
        withdrawalsEnabled &&
        bankWithdrawalsEnabled
    ) {
        warnings.push(
            'Bank withdrawals are enabled. Confirm that the bank-transfer ' +
            'provider is implemented and verified.'
        );
    }

    if (
        withdrawalsEnabled &&
        monnifyEnabled
    ) {
        warnings.push(
            'Monnify withdrawals are enabled in configuration. ' +
            'Environment validation does not verify authentication, ' +
            'provider permissions, or live transfers.'
        );
    }

    if (
        withdrawalsEnabled &&
        !monnifyEnabled &&
        !bankWithdrawalsEnabled
    ) {
        warnings.push(
            'No withdrawal provider is enabled.'
        );
    }

    // ----------------------------------------------
    // RETURN SHARED CONFIGURATION
    // ----------------------------------------------

    return Object.freeze({
        app: Object.freeze({
            name: appName,
            environment: nodeEnv,
            port,
            environmentValidationEnabled: validationEnabled,
            isProduction: nodeEnv === 'production',
            isDevelopment: nodeEnv === 'development',
            isTest: nodeEnv === 'test'
        }),

        skydrop: Object.freeze({
            withdrawalsEnabled,
            minimumWithdrawalNgn,
            bankWithdrawalsEnabled
        }),

        monnify: Object.freeze({
            enabled: monnifyEnabled,
            baseUrl: monnifyBaseUrl,
            apiKey: monnifyApiKey,
            secretKey: monnifySecretKey,
            contractCode: monnifyContractCode,
            disbursementPath: monnifyDisbursementPath,
            requestTimeoutMs: monnifyRequestTimeoutMs
        })
    });
}

// ==================================================
// INITIALIZE
// ==================================================

const rawEnvironment = loadEnvironment();

const config = validateEnvironment(rawEnvironment);

// ==================================================
// PUBLIC VALIDATION API
// ==================================================

function getValidationReport() {
    return {
        valid: errors.length === 0,
        errors: [...errors],
        warnings: [...warnings],
        environmentFileLoaded: envFileLoaded,
        hostingEnvironment: (
            isNonEmpty(process.env.RENDER) ||
            isNonEmpty(process.env.RENDER_SERVICE_ID) ||
            isNonEmpty(process.env.RENDER_EXTERNAL_HOSTNAME)
        ) ? 'render' : 'other'
    };
}

function assertValidEnvironment() {
    const report = getValidationReport();

    if (!report.valid) {
        const message = [
            'Tactical AI environment validation failed:',
            ...report.errors.map(item => `- ${item}`)
        ].join('\n');

        const error = new Error(message);
        error.code = 'ENV_VALIDATION_FAILED';
        error.validationErrors = report.errors;

        throw error;
    }

    return config;
}

function printValidationReport() {
    const report = getValidationReport();

    console.log('\n========================================');
    console.log('TACTICAL AI — SHARED ENVIRONMENT CHECK');
    console.log('========================================');

    console.log(
        `Hosting environment: ${report.hostingEnvironment}`
    );

    console.log(
        `NODE_ENV: ${config.app.environment}`
    );

    console.log(
        `Local .env file loaded: ${report.environmentFileLoaded}`
    );

    console.log(
        `Monnify enabled: ${config.monnify.enabled}`
    );

    console.log(
        `SkyDrop withdrawals enabled: ${config.skydrop.withdrawalsEnabled}`
    );

    console.log(
        `Environment validation: ${report.valid ? 'PASSED' : 'FAILED'}`
    );

    if (report.warnings.length > 0) {
        console.log('\nWARNINGS:');

        for (const item of report.warnings) {
            console.warn(`- ${item}`);
        }
    }

    if (report.errors.length > 0) {
        console.error('\nERRORS:');

        for (const item of report.errors) {
            console.error(`- ${item}`);
        }
    }

    console.log('========================================\n');

    return report;
}

// ==================================================
// EXPORT
// ==================================================

module.exports = Object.freeze({
    config,
    getValidationReport,
    assertValidEnvironment,
    printValidationReport
});
