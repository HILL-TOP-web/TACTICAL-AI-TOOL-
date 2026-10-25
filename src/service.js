'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const {
    config,
    assertValidEnvironment,
    printValidationReport
} = require('./config/env');

// ==================================================
// TACTICAL AI — STARTUP CONFIGURATION
// ==================================================

let server;
let isShuttingDown = false;

function startApplication() {
    // Validate environment before accepting requests.
    assertValidEnvironment();

    // Print configuration status without exposing secrets.
    printValidationReport();

    const app = express();

    // Trust proxy is useful behind Render's reverse proxy.
    // Express uses this for request IP/protocol information.
    app.set('trust proxy', 1);

    // ----------------------------------------------
    // SECURITY MIDDLEWARE
    // ----------------------------------------------

    app.disable('x-powered-by');

    app.use(helmet());

    app.use(cors({
        origin: process.env.CORS_ALLOWED_ORIGINS
            ? process.env.CORS_ALLOWED_ORIGINS
                .split(',')
                .map(origin => origin.trim())
                .filter(Boolean)
            : false,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Request-Id'
        ],
        credentials: false
    }));

    app.use(express.json({
        limit: '1mb'
    }));

    app.use(express.urlencoded({
        extended: false,
        limit: '1mb'
    }));

    // ----------------------------------------------
    // REQUEST SAFETY
    // ----------------------------------------------

    app.use((req, res, next) => {
        if (isShuttingDown) {
            return res.status(503).json({
                success: false,
                error: 'server-shutting-down',
                message: 'The server is shutting down. Please retry later.'
            });
        }

        next();
    });

    // ----------------------------------------------
    // ROOT ENDPOINT
    // ----------------------------------------------

    app.get('/', (req, res) => {
        res.status(200).json({
            success: true,
            application: config.app.name,
            message: 'Tactical AI backend is running.',
            environment: config.app.environment
        });
    });

    // ----------------------------------------------
    // HEALTH ENDPOINT
    // ----------------------------------------------

    app.get('/health', (req, res) => {
        const report = require('./config/env')
            .getValidationReport();

        const healthy =
            report.valid &&
            !isShuttingDown;

        res.status(healthy ? 200 : 503).json({
            success: healthy,
            application: config.app.name,
            status: healthy ? 'healthy' : 'unhealthy',
            environment: config.app.environment,
            checks: {
                environmentConfiguration: report.valid,
                shutdownInProgress: isShuttingDown
            }
        });
    });

    // ----------------------------------------------
    // WITHDRAWAL CONFIGURATION STATUS
    // ----------------------------------------------
    //
    // Do not expose API keys, secrets, contract codes,
    // account numbers, or private provider diagnostics.
    //
    // This endpoint reports configuration flags only.
    // It does NOT prove Monnify authentication works.
    // ----------------------------------------------

    app.get('/health/withdrawals', (req, res) => {
        res.status(200).json({
            success: true,
            withdrawals: {
                enabled: config.skydrop.withdrawalsEnabled,
                minimumWithdrawalNgn:
                    config.skydrop.minimumWithdrawalNgn,
                monnifyEnabled: config.monnify.enabled,
                bankWithdrawalsEnabled:
                    config.skydrop.bankWithdrawalsEnabled
            },
            note:
                'Configuration status only. Provider authentication, ' +
                'transaction processing, and reconciliation must be ' +
                'verified separately.'
        });
    });

    // ----------------------------------------------
    // 404 HANDLER
    // ----------------------------------------------

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: 'not-found',
            message: 'The requested endpoint does not exist.'
        });
    });

    // ----------------------------------------------
    // CENTRAL ERROR HANDLER
    // ----------------------------------------------

    app.use((err, req, res, next) => {
        if (res.headersSent) {
            return next(err);
        }

        if (err && err.type === 'entity.parse.failed') {
            return res.status(400).json({
                success: false,
                error: 'invalid-json',
                message: 'The request body contains invalid JSON.'
            });
        }

        if (err && err.type === 'entity.too.large') {
            return res.status(413).json({
                success: false,
                error: 'request-too-large',
                message: 'The request body exceeds the allowed size.'
            });
        }

        // Do not send stack traces, credentials, or internal
        // exception details to clients.
        console.error(
            '[Tactical AI] An unhandled request error occurred.'
        );

        return res.status(500).json({
            success: false,
            error: 'internal-server-error',
            message: 'An unexpected server error occurred.'
        });
    });

    // ----------------------------------------------
    // START LISTENER
    // ----------------------------------------------

    server = app.listen(config.app.port, '0.0.0.0', () => {
        console.log(
            `${config.app.name} listening on port ${config.app.port}.`
        );

        console.log(
            `Environment: ${config.app.environment}`
        );
    });

    server.on('error', err => {
        if (err && err.code === 'EADDRINUSE') {
            console.error(
                '[Tactical AI] The configured port is already in use.'
            );
        } else {
            console.error(
                '[Tactical AI] The HTTP server failed to start.'
            );
        }

        process.exitCode = 1;
    });

    return app;
}

// ==================================================
// GRACEFUL SHUTDOWN
// ==================================================

function shutdown(signal) {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(
        `[Tactical AI] Received ${signal}; shutting down.`
    );

    if (!server) {
        process.exitCode = 0;
        return;
    }

    const forceShutdownTimer = setTimeout(() => {
        console.error(
            '[Tactical AI] Graceful shutdown timed out.'
        );

        process.exit(1);
    }, 10000);

    forceShutdownTimer.unref();

    server.close(err => {
        clearTimeout(forceShutdownTimer);

        if (err) {
            console.error(
                '[Tactical AI] Server shutdown encountered an error.'
            );

            process.exitCode = 1;
            return;
        }

        console.log(
            '[Tactical AI] HTTP server closed successfully.'
        );

        process.exitCode = 0;
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ==================================================
// START APPLICATION
// ==================================================

try {
    startApplication();
} catch (err) {
    if (err && err.code === 'ENV_VALIDATION_FAILED') {
        console.error(
            '[Tactical AI] Startup blocked by environment validation.'
        );

        if (Array.isArray(err.validationErrors)) {
            for (const message of err.validationErrors) {
                console.error(`- ${message}`);
            }
        }
    } else {
        console.error(
            '[Tactical AI] Application startup failed.'
        );
    }

    process.exitCode = 1;
          }
