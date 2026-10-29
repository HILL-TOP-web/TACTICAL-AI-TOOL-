'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const {
    connectMongoDB
} = require('./skydrop/database/MongoDB');

const AuthRoutes = require('./skydrop/authentication/AuthRoutes');

const app = express();

/*
|--------------------------------------------------------------------------
| Security middleware
|--------------------------------------------------------------------------
*/

app.disable('x-powered-by');

app.use(helmet());

app.use(cors({
    origin: process.env.SKYDROP_FRONTEND_URL
        ? process.env.SKYDROP_FRONTEND_URL
        : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

/*
|--------------------------------------------------------------------------
| Request parsing
|--------------------------------------------------------------------------
*/

app.use(express.json({
    limit: '100kb'
}));

app.use(express.urlencoded({
    extended: false,
    limit: '100kb'
}));

/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
*/

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'SkyDrop API',
        status: 'running'
    });
});

/*
|--------------------------------------------------------------------------
| Authentication routes
|--------------------------------------------------------------------------
|
| POST /api/auth/register
| POST /api/auth/login
| GET  /api/auth/me
| POST /api/auth/logout
|
*/

app.use('/api/auth', AuthRoutes);

/*
|--------------------------------------------------------------------------
| Mount other SkyDrop routes here
|--------------------------------------------------------------------------
|
| Register your existing wallet, dashboard, transaction, transfer,
| withdrawal, mining, profile, and other API routers here.
|
| Example:
|
| app.use('/api/wallet', WalletRoutes);
| app.use('/api/dashboard', DashboardRoutes);
| app.use('/api/transactions', TransactionRoutes);
| app.use('/api/transfers', TransferRoutes);
| app.use('/api/withdrawals', WithdrawalRoutes);
|
| Only add these lines after confirming the corresponding files exist
| and export Express routers.
|
*/

/*
|--------------------------------------------------------------------------
| Not-found handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found.'
    });
});

/*
|--------------------------------------------------------------------------
| Central error handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON request body.'
        });
    }

    if (err && err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            error: 'Request body is too large.'
        });
    }

    console.error('SkyDrop API request failed.');

    return res.status(500).json({
        success: false,
        error: 'An internal server error occurred.'
    });
});

/*
|--------------------------------------------------------------------------
| Server startup
|--------------------------------------------------------------------------
*/

async function startServer() {
    // The database must connect before the API accepts requests.
    await connectMongoDB();

    const port = Number(process.env.PORT || 3000);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT must be a valid TCP port.');
    }

    return new Promise((resolve, reject) => {
        const server = app.listen(port, '0.0.0.0');

        server.once('listening', () => {
            console.log(`SkyDrop API listening on port ${port}`);
            resolve(server);
        });

        server.once('error', reject);
    });
}

/*
|--------------------------------------------------------------------------
| Start automatically when executed directly
|--------------------------------------------------------------------------
*/

if (require.main === module) {
    startServer().catch(() => {
        console.error(
            'SkyDrop startup failed. Check environment configuration and database connectivity.'
        );

        process.exit(1);
    });
}

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
    app,
    startServer
};
