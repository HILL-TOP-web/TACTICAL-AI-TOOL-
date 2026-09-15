'use strict';

/*
 * ============================================================
 * TACTICAL AI — MAIN SERVER
 * ============================================================
 *
 * Entry point:
 *
 *     node src/server.js
 *
 * or:
 *
 *     npm start
 *
 * This server wires together:
 *
 *   1. Express HTTP server
 *   2. Security middleware
 *   3. API middleware
 *   4. API routes
 *   5. Core Tactical AI modules
 *   6. Health/status endpoints
 *   7. Graceful shutdown
 *
 * The server is designed for controlled fictional training
 * simulations and decision-support applications.
 * ============================================================
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

// ------------------------------------------------------------
// Configuration
// ------------------------------------------------------------

let appConfig = {};

try {
  appConfig = require('../config/app.config');
} catch (error) {
  console.warn(
    '[CONFIG] config/app.config.js not found. Using environment defaults.'
  );
}

const PORT =
  Number(process.env.PORT) ||
  Number(appConfig.port) ||
  3000;

const HOST =
  process.env.HOST ||
  appConfig.host ||
  '0.0.0.0';

const NODE_ENV =
  process.env.NODE_ENV ||
  appConfig.environment ||
  'development';

// ------------------------------------------------------------
// Express application
// ------------------------------------------------------------

const app = express();

app.disable('x-powered-by');

// ------------------------------------------------------------
// Security
// ------------------------------------------------------------

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

// ------------------------------------------------------------
// CORS
// ------------------------------------------------------------

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);

// ------------------------------------------------------------
// Request body parsing
// ------------------------------------------------------------

app.use(
  express.json({
    limit: '1mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb'
  })
);

// ------------------------------------------------------------
// API middleware
// ------------------------------------------------------------

let requestLogger = null;
let errorHandler = null;

try {
  const middleware = require('../api/middleware');

  requestLogger = middleware.requestLogger;
  errorHandler = middleware.errorHandler;

  if (typeof requestLogger === 'function') {
    app.use(requestLogger);
  }

  console.log('[API] Middleware loaded.');
} catch (error) {
  console.warn(
    '[API] Middleware could not be loaded:',
    error.message
  );
}

// ------------------------------------------------------------
// Core module registry
// ------------------------------------------------------------

const modules = {
  core: null,
  terrain: null,
  situation: null,
  logistics: null,
  weather: null,
  routing: null,
  simulation: null,
  decisionSupport: null,
  training: null,
  knowledge: null,
  ai: null,
  conversation: null,
  data: null,
  models: null,
  utils: null
};

// ------------------------------------------------------------
// Safe module loader
// ------------------------------------------------------------

function loadModule(name, modulePath) {
  try {
    const loaded = require(modulePath);

    modules[name] = loaded;

    console.log(
      `[MODULE] ${name} loaded from ${modulePath}`
    );

    return loaded;
  } catch (error) {
    console.warn(
      `[MODULE] ${name} not loaded: ${error.message}`
    );

    return null;
  }
}

// ------------------------------------------------------------
// Load Tactical AI systems
// ------------------------------------------------------------

loadModule('core', './core');
loadModule('terrain', './terrain');
loadModule('situation', './situation');
loadModule('logistics', './logistics');
loadModule('weather', './weather');
loadModule('routing', './routing');
loadModule('simulation', './simulation');
loadModule(
  'decisionSupport',
  './decision-support'
);
loadModule('training', './training');
loadModule('knowledge', './knowledge');
loadModule('ai', './ai');
loadModule('conversation', './conversation');
loadModule('data', './data');
loadModule('models', './models');
loadModule('utils', './utils');

// ------------------------------------------------------------
// API routes
// ------------------------------------------------------------

let apiRoutes = null;

try {
  apiRoutes = require('../api/routes');

  app.use('/api', apiRoutes);

  console.log('[API] Routes loaded.');
} catch (error) {
  console.error(
    '[API] Failed to load API routes:',
    error.message
  );
}

// ------------------------------------------------------------
// Root endpoint
// ------------------------------------------------------------

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'Tactical AI',
    service: 'tactical-ai-server',
    environment: NODE_ENV,
    status: 'online',
    mode: 'training',
    timestamp: new Date().toISOString()
  });
});

// ------------------------------------------------------------
// Health endpoint
// ------------------------------------------------------------

app.get('/health', (req, res) => {
  const loadedModules = Object.entries(modules)
    .filter(([, value]) => value !== null)
    .map(([name]) => name);

  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'tactical-ai',
    environment: NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    modules: loadedModules
  });
});

// ------------------------------------------------------------
// System status
// ------------------------------------------------------------

app.get('/status', (req, res) => {
  const moduleStatus = {};

  for (const [name, value] of Object.entries(modules)) {
    moduleStatus[name] = {
      loaded: value !== null
    };
  }

  res.status(200).json({
    success: true,
    service: 'tactical-ai',
    status: 'operational',
    mode: 'training',
    environment: NODE_ENV,
    modules: moduleStatus,
    timestamp: new Date().toISOString()
  });
});

// ------------------------------------------------------------
// API status
// ------------------------------------------------------------

app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    api: 'online',
    version: process.env.API_VERSION || '1.0.0',
    mode: 'training',
    timestamp: new Date().toISOString()
  });
});

// ------------------------------------------------------------
// 404 handler
// ------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ------------------------------------------------------------
// Error handler
// ------------------------------------------------------------

if (typeof errorHandler === 'function') {
  app.use(errorHandler);
} else {
  app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err);

    res.status(
      Number.isInteger(err.statusCode)
        ? err.statusCode
        : 500
    ).json({
      success: false,
      error:
        err.statusCode
          ? err.message
          : 'Internal server error'
    });
  });
}

// ------------------------------------------------------------
// Server reference
// ------------------------------------------------------------

let server = null;

// ------------------------------------------------------------
// Start server
// ------------------------------------------------------------

function startServer() {
  if (server) {
    console.warn('[SERVER] Server is already running.');
    return server;
  }

  server = app.listen(PORT, HOST, () => {
    console.log('');
    console.log('==============================================');
    console.log('           TACTICAL AI ONLINE');
    console.log('==============================================');
    console.log(`Environment : ${NODE_ENV}`);
    console.log(`Host        : ${HOST}`);
    console.log(`Port        : ${PORT}`);
    console.log(`Mode        : training`);
    console.log(`API         : /api`);
    console.log(`Health      : /health`);
    console.log(`Status      : /status`);
    console.log('==============================================');
    console.log('');
  });

  server.on('error', (error) => {
    console.error('[SERVER] Server error:', error);
  });

  return server;
}

// ------------------------------------------------------------
// Graceful shutdown
// ------------------------------------------------------------

async function shutdown(signal) {
  console.log('');
  console.log(
    `[SERVER] Received ${signal}. Shutting down...`
  );

  if (!server) {
    process.exit(0);
  }

  server.close(() => {
    console.log('[SERVER] HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.warn(
      '[SERVER] Forced shutdown after timeout.'
    );

    process.exit(1);
  }, 10000).unref();
}

// ------------------------------------------------------------
// Process signals
// ------------------------------------------------------------

process.on(
  'SIGTERM',
  () => shutdown('SIGTERM')
);

process.on(
  'SIGINT',
  () => shutdown('SIGINT')
);

// ------------------------------------------------------------
// Unhandled errors
// ------------------------------------------------------------

process.on(
  'unhandledRejection',
  (reason) => {
    console.error(
      '[PROCESS] Unhandled promise rejection:',
      reason
    );
  }
);

process.on(
  'uncaughtException',
  (error) => {
    console.error(
      '[PROCESS] Uncaught exception:',
      error
    );

    shutdown('uncaughtException');
  }
);

// ------------------------------------------------------------
// Start automatically when executed directly
// ------------------------------------------------------------

if (require.main === module) {
  startServer();
}

// ------------------------------------------------------------
// Exports
// ------------------------------------------------------------

module.exports = {
  app,
  startServer,
  shutdown,
  modules
};
