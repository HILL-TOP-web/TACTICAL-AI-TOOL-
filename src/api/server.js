'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const routes = require('./routes');
const { requestLogger, errorHandler } = require('./middleware');

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// --------------------------------------------------
// Security & request parsing
// --------------------------------------------------

app.disable('x-powered-by');

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(requestLogger);

// --------------------------------------------------
// Health endpoint
// --------------------------------------------------

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'tactical-ai-api',
    timestamp: new Date().toISOString()
  });
});

// --------------------------------------------------
// API routes
// --------------------------------------------------

app.use('/api', routes);

// --------------------------------------------------
// 404 handler
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// --------------------------------------------------
// Error handler
// --------------------------------------------------

app.use(errorHandler);

// --------------------------------------------------
// Start server
// --------------------------------------------------

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(
      `Tactical AI API running on http://${HOST}:${PORT}`
    );
  });
}

module.exports = app;
