'use strict';

const express = require('express');

function createWithdrawalRoutes({
  controller,
  authenticate,
  authorize
}) {
  if (typeof authenticate !== 'function') {
    throw new Error(
      'WithdrawalRoutes requires the existing authenticate middleware.'
    );
  }

  if (!controller) {
    throw new Error(
      'WithdrawalRoutes requires a withdrawal controller.'
    );
  }

  const router = express.Router();

  // List available withdrawal methods.
  router.get(
    '/methods',
    authenticate,
    controller.methods
  );

  // Submit a withdrawal.
  const createMiddleware = [authenticate];

  if (typeof authorize === 'function') {
    createMiddleware.push(
      authorize('withdrawals:create')
    );
  }

  createMiddleware.push(controller.create);

  router.post(
    '/',
    ...createMiddleware
  );

  // List the authenticated user's withdrawals.
  router.get(
    '/',
    authenticate,
    controller.list
  );

  // Retrieve one withdrawal belonging to the user.
  router.get(
    '/:id',
    authenticate,
    controller.get
  );

  return router;
}

module.exports = {
  createWithdrawalRoutes
};
