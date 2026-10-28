'use strict';

const express = require('express');

function createTransferRouter({
  transferController,
  authenticate,
  authorizeTransfer
}) {
  if (!transferController) {
    throw new Error('TransferController is required.');
  }

  if (typeof authenticate !== 'function') {
    throw new Error(
      'The existing authentication middleware must be supplied.'
    );
  }

  if (typeof authorizeTransfer !== 'function') {
    throw new Error(
      'The existing transfer authorization middleware must be supplied.'
    );
  }

  const router = express.Router();

  router.use(authenticate);

  router.post(
    '/',
    authorizeTransfer,
    transferController.createTransfer
  );

  router.get(
    '/',
    authorizeTransfer,
    transferController.getTransferHistory
  );

  router.get(
    '/:reference',
    authorizeTransfer,
    transferController.getTransfer
  );

  return router;
}

module.exports = createTransferRouter;
