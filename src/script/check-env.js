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

        if (parsed.protocol !== 'https:') {
            return false;
        }

        if (
            parsed.username ||
            parsed.password ||
            parsed.search ||
            parsed.hash
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

function loadEnvironment() {
    let fileEnv = {};
    let envFileLoaded = false;

    // Local development may use .env.
    // Render production should normally use its dashboard variables.
    if (fs.existsSync(ENV_PATH)) {
        try {
            const result = dotenv.config({
                path: ENV_PATH,
                override: false,
                quiet: true
            });

            if (result.error) {
                error('The project-root .env file could not be loaded.');
            } else {
                fileEnv = result.parsed || {};
                envFileLoaded = true;
            }
        } catch {
            error('The project-root .env file could not be loaded.');
        }
    }

    // process.env contains variables supplied by Render,
    // the hosting environment, or the local shell.
    // Existing process variables take precedence over .env.
    const env = {
        ...fileEnv,
        ...process.env
    };

    return {
        env,
        envFileLoaded
    };
}

function runChecks() {
    console.log('\n========================================');
    console.log('TACTICAL AI — ENVIRONMENT CHECK');
    console.log('========================================\n');

    const isRender =
        isNonEmpty(process.env.RENDER) ||
        isNonEmpty(process.env.RENDER_SERVICE_ID) ||
        isNonEmpty(process.env.RENDER_EXTERNAL_HOSTNAME);

    if (isRender) {
        console.log('Execution environment: Render');
        console.log(
            'Checking variables available to the Render service.'
        );
    } else {
        console.log(
            'Execution environment: Local or another hosting provider.'
        );
    }

    const { env, envFileLoaded } = loadEnvironment();

    if (envFileLoaded) {
        console.log('Local .env file: loaded.');
    } else if (isRender) {
        console.log(
            'Local .env file: not required; checking Render/process variables.'
        );
    } else {
        console.log(
            'Local .env file: not found; checking process environment variables.'
        );
    }

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

        if (!allowedEnvironments.includes(env.NODE_ENV.trim())) {
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

    checkRequired('APP_NAME', env);

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
    // WITHDRAWAL MINIMUM
    // ----------------------------------------

    if (!isNonEmpty(env.SKYDROP_MIN_WITHDRAWAL_NGN)) {
        error('SKYDROP_MIN_WITHDRAWAL_NGN is missing.');
    } else {
        const minimum = Number(
            env.SKYDROP_MIN_WITHDRAWAL_NGN
        );

        if (
            !Number.isFinite(minimum) ||
            minimum !== 100
        ) {
            error(
                'SKYDROP_MIN_WITHDRAWAL_NGN must be 100 NGN.'
            );
        }
    }

    // There must be no SkyDrop-configured maximum withdrawal.
    if (
        Object.prototype.hasOwnProperty.call(
            env,
            'SKYDROP_MAX_WITHDRAWAL_NGN'
        )
    ) {
        error(
            'Remove SKYDROP_MAX_WITHDRAWAL_NGN. ' +
            'SkyDrop must not configure an application-level maximum.'
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
                'MONNIFY_BASE_URL must be a valid HTTPS URL.'
            );
        }

        if (
            isNonEmpty(env.MONNIFY_BASE_URL) &&
            env.MONNIFY_BASE_URL.trim().replace(/\/+$/, '') !==
                'https://api.monnify.com'
        ) {
            error(
                'MONNIFY_BASE_URL must use the Monnify production API: ' +
                'https://api.monnify.com'
            );
        }

        if (
            isNonEmpty(env.MONNIFY_DISBURSEMENT_PATH) &&
            !validateDisbursementPath(
                env.MONNIFY_DISBURSEMENT_PATH
            )
        ) {
            error(
                'MONNIFY_DISBURSEMENT_PATH must be a relative API path ' +
                'beginning with one slash. Verify it against your ' +
                'approved Monnify integration documentation.'
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
    // OPTIONAL WITHDRAWAL METHOD SWITCH
    // ----------------------------------------

    if (
        isTrue(env.SKYDROP_WITHDRAWALS_ENABLED) &&
        isTrue(env.MONNIFY_ENABLED)
    ) {
        warning(
            'Monnify is enabled in configuration. This check does not ' +
            'authenticate with Monnify or verify live transfers.'
        );
    }

    if (isTrue(env.SKYDROP_BANK_WITHDRAWALS_ENABLED)) {
        warning(
            'Bank withdrawals are enabled. Verify that a real, ' +
            'authorized bank-transfer provider is implemented.'
        );
    }

    if (
        isTrue(env.SKYDROP_WITHDRAWALS_ENABLED) &&
        !isTrue(env.MONNIFY_ENABLED) &&
        !isTrue(env.SKYDROP_BANK_WITHDRAWALS_ENABLED)
    ) {
        warning(
            'Withdrawals are enabled, but no withdrawal method is enabled.'
        );
    }

    // ----------------------------------------
    // RENDER ENVIRONMENT SUMMARY
    // ----------------------------------------

    if (isRender) {
        console.log('\nRender environment-variable checks:');

        const importantVariables = [
            'NODE_ENV',
            'PORT',
            'APP_NAME',
            'SKYDROP_WITHDRAWALS_ENABLED',
            'SKYDROP_MIN_WITHDRAWAL_NGN',
            'MONNIFY_ENABLED',
            'MONNIFY_BASE_URL',
            'MONNIFY_API_KEY',
            'MONNIFY_SECRET_KEY',
            'MONNIFY_CONTRACT_CODE',
            'MONNIFY_DISBURSEMENT_PATH',
            'MONNIFY_REQUEST_TIMEOUT_MS',
            'SKYDROP_BANK_WITHDRAWALS_ENABLED'
        ];

        for (const name of importantVariables) {
            const present = isNonEmpty(env[name]);

            // Report only whether the variable exists.
            // Never print credentials or secret values.
            console.log(
                `- ${name}: ${present ? 'PRESENT' : 'MISSING/EMPTY'}`
            );
        }
    }
}

runChecks();

console.log('\n----------------------------------------');

if (warnings.length > 0) {
    console.log('\nWARNINGS:');

    for (const item of warnings) {
        console.log(`- ${item}`);
    }
}

if (errors.length > 0) {
    console.error('\nCONFIGURATION ERRORS:');

    for (const item of errors) {
        console.error(`- ${item}`);
    }

    console.error(
        '\nEnvironment check FAILED. Correct the listed errors.'
    );

    process.exitCode = 1;
} else {
    console.log('\nEnvironment configuration check PASSED.');
    console.log(
        'Required configuration values passed the implemented checks.'
    );
    console.log(
        'This does not prove Monnify authentication, database connectivity, ' +
        'or live withdrawal functionality.'
    );
}

console.log('\n========================================\n');
