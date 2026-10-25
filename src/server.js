'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const {
  config,
  printValidationReport
} = require('./config/env');

const { pool } = require('./db/pool');
const { WithdrawalRepository } = require('./db/WithdrawalRepository');
const { requireAuth } = require('./middleware/requireAuth');

const {
  createSkydropWithdrawalRouter
} = require('./routes/skydropWithdrawals');

const {
  createMonnifyWebhookRouter
} = require('./finance/banking/monnify/MonnifyWalletWebhook');

const {
  reconcilePending
} = require('./finance/banking/monnify/MonnifyWalletReconciliation');

printValidationReport();

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());

app.use(cors({
  origin(origin, callback) {
    if (!origin || config.corsAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Idempotency-Key'
  ],
  credentials: false
}));

// Health endpoint.
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      ok: true,
      service: config.appName,
      database: 'connected',
      withdrawalsEnabled:
        config.withdrawalsEnabled &&
        config.bankWithdrawalsEnabled &&
        config.monnifyEnabled
    });
  } catch {
    res.status(503).json({
      ok: false,
      database: 'unavailable'
    });
  }
});

// Persistent withdrawal repository.
const repository = new WithdrawalRepository(pool);

// IMPORTANT:
// Mount the raw-body webhook before express.json().
// Monnify webhook signature verification depends on the original body.
app.use(
  '/api/webhooks/monnify',
  createMonnifyWebhookRouter({ repository })
);

// JSON middleware for normal API requests.
app.use(express.json({
  limit: '32kb'
}));

// SkyDrop withdrawal API.
app.use(
  '/api/skydrop/withdrawals',
  createSkydropWithdrawalRouter({
    repository,
    requireAuth
  })
);

// Background reconciliation.
let reconciliationRunning = false;

const reconciliationTimer = setInterval(async () => {
  if (reconciliationRunning || !config.monnifyEnabled) {
    return;
  }

  reconciliationRunning = true;

  try {
    const results = await reconcilePending(repository, 50);

    const errors = results.filter(
      result => result.error
    ).length;

    if (results.length) {
      console.log(
        `[reconciliation] checked=${results.length} errors=${errors}`
      );
    }
  } catch (error) {
    console.error(
      '[reconciliation] cycle failed:',
      error.message
    );
  } finally {
    reconciliationRunning = false;
  }
}, 60000);

reconciliationTimer.unref();

// Central error handler.
app.use((err, _req, res, _next) => {
  const status = Number.isInteger(err.statusCode)
    ? err.statusCode
    : 500;

  if (status >= 500) {
    console.error('[request-error]', err.message);
  }

  res.status(status).json({
    ok: false,
    error: status >= 500
      ? 'Request could not be completed.'
      : err.message,
    code: err.code || undefined
  });
});

const server = app.listen(
  config.port,
  '0.0.0.0',
  () => {
    console.log(
      `${config.appName} listening on ${config.port}`
    );
  }
);

// Graceful shutdown.
async function shutdown(signal) {
  console.log(`${signal}: shutting down`);

  clearInterval(reconciliationTimer);

  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = {
  app,
  server
};
