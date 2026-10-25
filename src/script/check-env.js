'use strict';

const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(PROJECT_ROOT, '.env');

const errors = [];
const warnings = [];

function error(message) {
    errors.push(message);
}

function warning(message) {
    warnings.push(message);
}

function isTrue(value) {
    return typeof value === 'string' &&
        value.trim().toLowerCase() === 'true';
}

function isFalse(value) {
    return typeof value === 'string' &&
        value.trim().toLowerCase() === 'false';
}

function isNonEmpty(value) {
    return typeof value === 'string' &&
        value.trim().length > 0;
}

function checkRequired(name, env) {
    if (!isNonEmpty(env[name])) {
        error(`${name} is missing or empty.`);
    }
}

function checkBoolean(name, env) {
    if (!isTrue(env[name]) && !isFalse(env[name])) {
        error(`${name} must be either true or false.`);
    }
}

function validateBaseUrl(value) {
    if (!isNonEmpty(value)) {
        return false;
    }

    try {
        const parsed = new URL(value);

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return false;
        }

        const isLocalhost =
            parsed.hostname === 'localhost' ||
            parsed.hostname === '127.0.0.1' ||
            parsed.hostname === '[::1]';

        if (
            parsed.protocol !== 'https:' &&
            !isLocalhost
        ) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

function validateDisbursementPath(value) {
    if (!isNonEmpty(value)) {
        return false;
    }

    const trimmed = value.trim();

    // Require a relative API path, not a full URL.
    if (!trimmed.startsWith('/')) {
        return false;
    }

    if (trimmed.startsWith('//')) {
        return false;
    }

    if (/^https?:\/\//i.test(trimmed)) {
        return false;
    }

    return true;
}

function runChecks() {
    console.log('\n========================================');
    console.log('TACTICAL AI — ENVIRONMENT CHECK');
    console.log('========================================\n');

    if (!fs.existsSync(ENV_PATH)) {
        error('The project-root .env file does not exist.');
        error('Create .env using .env.example as your template.');
        return;
    }

    let parsedEnv;

    try {
        const result = dotenv.config({
            path: ENV_PATH,
            override: false
        });

        if (result.error) {
            throw result.error;
        }

        parsedEnv = result.parsed || {};
    } catch {
        error('The .env file could not be loaded.');
        return;
    }

    // Prefer values already loaded into the process.
    // dotenv does not overwrite existing process variables.
    const env = {
        ...parsedEnv,
        ...process.env
    };

    // ----------------------------------------
    // APPLICATION CONFIGURATION
    // ----------------------------------------

    checkRequired('NODE_ENV', env);
    checkRequired('PORT', env);
    checkRequired('APP_NAME', env);

    if (isNonEmpty(env.NODE_ENV)) {
        const allowedEnvironments = [
            'development',
            'test',
            'production'
        ];

        if (!allowedEnvironments.includes(env.NODE_ENV)) {
            error(
                'NODE_ENV must be development, test, or production.'
            );
        }
    }

    if (isNonEmpty(env.PORT)) {
        const port = Number(env.PORT);

        if (
            !Number.isInteger(port) ||
            port < 1 ||
            port > 65535
        ) {
            error('PORT must be an integer from 1 to 65535.');
        }
    }

    if (isNonEmpty(env.APP_NAME) && !env.APP_NAME.trim()) {
        error('APP_NAME cannot be empty.');
    }

    // ----------------------------------------
    // WITHDRAWAL SWITCHES
    // ----------------------------------------

    const switches = [
        'SKYDROP_WITHDRAWALS_ENABLED',
        'MONNIFY_ENABLED',
        'SKYDROP_BANK_WITHDRAWALS_ENABLED'
    ];

    for (const name of switches) {
        checkBoolean(name, env);
    }

    // ----------------------------------------
    // WITHDRAWAL LIMITS
    // ----------------------------------------

    if (!isNonEmpty(env.SKYDROP_MIN_WITHDRAWAL_NGN)) {
        error('SKYDROP_MIN_WITHDRAWAL_NGN is missing.');
    } else {
        const minimum = Number(
            env.SKYDROP_MIN_WITHDRAWAL_NGN
        );

        if (!Number.isFinite(minimum) || minimum <= 0) {
            error(
                'SKYDROP_MIN_WITHDRAWAL_NGN must be a positive number.'
            );
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            env,
            'SKYDROP_MAX_WITHDRAWAL_NGN'
        )
    ) {
        error(
            'Remove SKYDROP_MAX_WITHDRAWAL_NGN. ' +
            'The application-level maximum is not configured.'
        );
    }

    // ----------------------------------------
    // MONNIFY CONFIGURATION
    // ----------------------------------------

    if (isTrue(env.MONNIFY_ENABLED)) {
        const requiredMonnifyVariables = [
            'MONNIFY_BASE_URL',
            'MONNIFY_API_KEY',
            'MONNIFY_SECRET_KEY',
            'MONNIFY_CONTRACT_CODE',
            'MONNIFY_DISBURSEMENT_PATH'
        ];

        for (const name of requiredMonnifyVariables) {
            checkRequired(name, env);
        }

        if (
            isNonEmpty(env.MONNIFY_BASE_URL) &&
            !validateBaseUrl(env.MONNIFY_BASE_URL)
        ) {
            error(
                'MONNIFY_BASE_URL must be a valid HTTPS URL, ' +
                'except localhost may use HTTP.'
            );
        }

        if (
            isNonEmpty(env.MONNIFY_DISBURSEMENT_PATH) &&
            !validateDisbursementPath(
                env.MONNIFY_DISBURSEMENT_PATH
            )
        ) {
            error(
                'MONNIFY_DISBURSEMENT_PATH must be a relative ' +
                'path beginning with one slash. Verify the ' +
                'endpoint against your Monnify documentation.'
            );
        }
    }

    // ----------------------------------------
    // MONNIFY REQUEST TIMEOUT
    // ----------------------------------------

    if (!isNonEmpty(env.MONNIFY_REQUEST_TIMEOUT_MS)) {
        error('MONNIFY_REQUEST_TIMEOUT_MS is missing.');
    } else {
        const timeout = Number(
            env.MONNIFY_REQUEST_TIMEOUT_MS
        );

        if (
            !Number.isInteger(timeout) ||
            timeout < 1000 ||
            timeout > 120000
        ) {
            error(
                'MONNIFY_REQUEST_TIMEOUT_MS must be an integer ' +
                'between 1000 and 120000 milliseconds.'
            );
        }
    }

    // ----------------------------------------
    // INTEGRATION WARNINGS
    // ----------------------------------------

    if (
        isTrue(env.SKYDROP_WITHDRAWALS_ENABLED) &&
        isTrue(env.MONNIFY_ENABLED)
    ) {
        warning(
            'Monnify is enabled in configuration. ' +
            'This check does not authenticate with Monnify ' +
            'or verify that live transfers work.'
        );
    }

    if (isTrue(env.SKYDROP_BANK_WITHDRAWALS_ENABLED)) {
        warning(
            'Bank withdrawals are enabled in configuration. ' +
            'Verify that a real, authorized bank-transfer ' +
            'provider is implemented before processing requests.'
        );
    }

    if (
        isTrue(env.SKYDROP_WITHDRAWALS_ENABLED) &&
        !isTrue(env.MONNIFY_ENABLED) &&
        !isTrue(env.SKYDROP_BANK_WITHDRAWALS_ENABLED)
    ) {
        warning(
            'Withdrawals are enabled, but no withdrawal method ' +
            'is enabled.'
        );
    }
}

runChecks();

console.log('----------------------------------------');

if (warnings.length > 0) {
    console.log('\nWARNINGS:');

    for (const item of warnings) {
        console.log(`- ${item}`);
    }
}

if (errors.length > 0) {
    console.log('\nCONFIGURATION ERRORS:');

    for (const item of errors) {
        console.error(`- ${item}`);
    }

    console.error(
        '\nEnvironment check FAILED. Correct the listed errors.'
    );

    process.exitCode = 1;
} else {
    console.log('\nEnvironment configuration check PASSED.');
    console.log('Required configuration values were validated.');
    console.log(
        'Note: passing this check does not prove provider connectivity.'
    );
}

console.log('\n========================================\n');
