'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('node:path');

const {
    validateEnvironment
} = require('../scripts/check-env');

const app = express();

const PORT = Number(process.env.PORT || 3000);

const allowedOrigins = (
    process.env.CORS_ORIGIN ||
    'http://localhost:3000'
)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.disable('x-powered-by');

app.use(helmet());

app.use(cors({
    origin(origin, callback) {
        if (
            !origin ||
            allowedOrigins.includes(origin)
        ) {
            return callback(null, true);
        }

        return callback(
            new Error('Origin not allowed by CORS.')
        );
    }
}));

app.use(express.json({
    limit: '1mb'
}));

app.use(express.urlencoded({
    extended: false,
    limit: '1mb'
}));

app.get('/health', (req, res) => {
    const databaseReady =
        mongoose.connection.readyState === 1;

    res.status(databaseReady ? 200 : 503).json({
        success: databaseReady,
        service: 'tactical-ai',
        database: databaseReady
            ? 'connected'
            : 'unavailable',
        timestamp: new Date().toISOString()
    });
});

const ROUTE_MODULES = [
    {
        name: 'dashboard',
        mountPath: '/api/dashboard',
        file: '../skydrop/api/dashboard.routes'
    },
    {
        name: 'wallet',
        mountPath: '/api/wallet',
        file: '../skydrop/api/wallet.routes'
    },
    {
        name: 'transactions',
        mountPath: '/api/transactions',
        file: '../skydrop/api/transactions.routes'
    },
    {
        name: 'transfers',
        mountPath: '/api/transfers',
        file: '../skydrop/api/transfers.routes'
    },
    {
        name: 'withdrawals',
        mountPath: '/api/withdrawals',
        file: '../skydrop/api/withdrawals.routes'
    }
];

function loadRouteModule(routeDefinition) {
    const absolutePath = path.resolve(
        __dirname,
        routeDefinition.file
    );

    let exportedModule;

    try {
        exportedModule = require(absolutePath);
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            const missingDependency = (
                error.message.match(
                    /Cannot find module '([^']+)'/
                ) || []
            )[1];

            const isRouteFileMissing =
                missingDependency === absolutePath ||
                missingDependency === `${absolutePath}.js`;

            if (isRouteFileMissing) {
                console.error(
                    `Route module missing: ${routeDefinition.file}`
                );

                return false;
            }
        }

        throw error;
    }

    const router =
        exportedModule.router || exportedModule;

    if (
        typeof router !== 'function' ||
        typeof router.use !== 'function'
    ) {
        throw new TypeError(
            `Route module "${routeDefinition.name}" must export ` +
            'an Express Router directly or through a router property.'
        );
    }

    app.use(
        routeDefinition.mountPath,
        router
    );

    console.log(
        `Mounted ${routeDefinition.mountPath}`
    );

    return true;
}

function mountRoutes() {
    const missingRoutes = [];

    for (const routeDefinition of ROUTE_MODULES) {
        const mounted = loadRouteModule(
            routeDefinition
        );

        if (!mounted) {
            missingRoutes.push(
                routeDefinition.name
            );
        }
    }

    return missingRoutes;
}

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (
        error.message ===
        'Origin not allowed by CORS.'
    ) {
        return res.status(403).json({
            success: false,
            error: 'Origin not allowed'
        });
    }

    if (
        error instanceof SyntaxError &&
        'body' in error
    ) {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON request body'
        });
    }

    console.error(
        'Request processing failed.'
    );

    return res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

let server;
let shuttingDown = false;

async function startServer() {
    if (!validateEnvironment()) {
        throw new Error(
            'Environment validation failed. Server startup aborted.'
        );
    }

    if (!process.env.MONGODB_URI) {
        throw new Error(
            'MONGODB_URI is required.'
        );
    }

    await mongoose.connect(
        process.env.MONGODB_URI,
        {
            serverSelectionTimeoutMS: 10000
        }
    );

    console.log(
        'MongoDB connection established.'
    );

    const missingRoutes = mountRoutes();

    if (missingRoutes.length > 0) {
        console.error(
            'Some API route modules are missing:',
            missingRoutes.join(', ')
        );

        console.error(
            'Create and connect these modules before treating ' +
            'the corresponding endpoints as implemented.'
        );
    }

    server = app.listen(PORT, () => {
        console.log(
            `Tactical AI server listening on port ${PORT}.`
        );
    });

    return server;
}

async function shutdown(signal) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log(
        `Received ${signal}; shutting down.`
    );

    if (server) {
        await new Promise((resolve) => {
            server.close(resolve);
        });
    }

    try {
        await mongoose.disconnect();
    } catch {
        console.error(
            'MongoDB shutdown encountered an error.'
        );

        process.exitCode = 1;
    }
}

process.once('SIGINT', () => {
    shutdown('SIGINT').catch(() => {
        process.exitCode = 1;
    });
});

process.once('SIGTERM', () => {
    shutdown('SIGTERM').catch(() => {
        process.exitCode = 1;
    });
});

if (require.main === module) {
    startServer().catch((error) => {
        console.error(
            'Server startup failed:',
            error.message
        );

        process.exitCode = 1;
    });
}

module.exports = {
    app,
    startServer,
    mountRoutes
};
