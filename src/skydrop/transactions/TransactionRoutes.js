'use strict';

const express = require('express');
const TransactionController = require('./TransactionController');

function createTransactionRoutes({
  authenticate,
  authorize,
  controller = new TransactionController()
} = {}) {
  if (typeof authenticate !== 'function') {
    throw new Error(
      'Authentication middleware must be provided.'
    );
  }

  const router = express.Router();

  router.post(
    '/',
    authenticate,
    ...(authorize ? [authorize('transactions:create')] : []),
    controller.create
  );

  router.get(
    '/',
    authenticate,
    ...(authorize ? [authorize('transactions:read')] : []),
    controller.getHistory
  );

  router.get(
    '/:reference',
    authenticate,
    ...(authorize ? [authorize('transactions:read')] : []),
    controller.getByReference
  );

  return router;
}

module.exports = createTransactionRoutes;
