'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const {
    connectDatabase,
    disconnectDatabase
} = require('./skydrop/database/database');

const {
    createAuthenticationRoutes
} = require('./skydrop/authentication/AuthenticationRoutes');

const app = express();

/*
|--------------------------------------------------------------------------
| Application Configuration
|--------------------------------------------------------------------------
*/

app.disable('x-powered-by');

app.use(helmet());

app.use(cors({
    origin: process.env.SKYDROP_FRONTEND_URL
        ? process.env.SKYDROP_FRONTEND_URL
            .split(',')
            .map((origin) => origin.trim())
        : false,
    credentials: true
}));

app.use(express.json({
    limit: '1mb'
}));

app.use(express.urlencoded({
    extended: false,
    limit: '1mb'
}));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'Tactical AI / SkyDrop API',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

app.use(
    '/api/auth',
    createAuthenticationRoutes()
);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl
    });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON request body'
        });
    }

    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            error: 'Request body is too large'
        });
    }

    // Log the error server-side without exposing internal details.
    console.error('Request processing failed:', error.message);

    return res.status(error.statusCode || 500).json({
        success: false,
        error: error.statusCode && error.statusCode < 500
            ? error.message
            : 'Internal server error'
    });
});

/*
|--------------------------------------------------------------------------
| Server Lifecycle
|--------------------------------------------------------------------------
*/

let server = null;
let shutdownPromise = null;

async function startServer() {
    if (server) {
        return server;
    }

    /*
     * Connect to MongoDB before accepting HTTP requests.
     * If the database connection fails, startup fails.
     */
    await connectDatabase();

    const port = Number(process.env.PORT) || 3000;

    try {
        server = await new Promise((resolve, reject) => {
            const httpServer = app.listen(port);

            httpServer.once('listening', () => {
                resolve(httpServer);
            });

            httpServer.once('error', (error) => {
                reject(error);
            });
        });

        console.log(`Server listening on port ${port}`);

        return server;
    } catch (error) {
        server = null;

        try {
            await disconnectDatabase();
        } catch (databaseError) {
            console.error(
                'Database cleanup after startup failure failed:',
                databaseError.message
            );
        }

        throw error;
    }
}

/*
|--------------------------------------------------------------------------
| Graceful Shutdown
|--------------------------------------------------------------------------
*/

async function shutdown(signal = 'shutdown') {
    if (shutdownPromise) {
        return shutdownPromise;
    }

    shutdownPromise = (async () => {
        console.log(`Received ${signal}. Shutting down gracefully...`);

        let shutdownError = null;

        if (server) {
            const activeServer = server;
            server = null;

            try {
                await new Promise((resolve, reject) => {
                    activeServer.close((error) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });

                    // Close idle keep-alive connections where supported.
                    if (
                        typeof activeServer.closeIdleConnections === 'function'
                    ) {
                        activeServer.closeIdleConnections();
                    }
                });
            } catch (error) {
                shutdownError = error;

                console.error(
                    'HTTP server shutdown failed:',
                    error.message
                );
            }
        }

        try {
            await disconnectDatabase();
            console.log('MongoDB connection closed.');
        } catch (error) {
            shutdownError = shutdownError || error;

            console.error(
                'MongoDB shutdown failed:',
                error.message
            );
        }

        if (shutdownError) {
            process.exitCode = 1;
        } else {
            console.log('Shutdown completed successfully.');
        }
    })();

    return shutdownPromise;
}

/*
|--------------------------------------------------------------------------
| Process Signal Handlers
|--------------------------------------------------------------------------
*/

if (require.main === module) {
    process.once('SIGTERM', () => {
        shutdown('SIGTERM').catch((error) => {
            console.error('Shutdown failed:', error.message);
            process.exitCode = 1;
        });
    });

    process.once('SIGINT', () => {
        shutdown('SIGINT').catch((error) => {
            console.error('Shutdown failed:', error.message);
            process.exitCode = 1;
        });
    });

    startServer().catch(async (error) => {
        console.error('Server startup failed:', error.message);

        try {
            await disconnectDatabase();
        } catch (databaseError) {
            console.error(
                'Database cleanup failed:',
                databaseError.message
            );
        }

        process.exitCode = 1;
    });
}

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
    app,
    startServer,
    shutdown
};
