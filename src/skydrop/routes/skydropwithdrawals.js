'use strict';

const express = require('express');

const {
  WithdrawalEngine
} = require('../skydrop/withdrawals/WithdrawalEngine');

function createSkydropWithdrawalRouter({
  repository,
  requireAuth
}) {
  if (!repository) {
    throw new Error(
      'Withdrawal routes require a persistent repository.'
    );
  }

  if (typeof requireAuth !== 'function') {
    throw new Error(
      'Withdrawal routes require authentication middleware.'
    );
  }

  const router = express.Router();

  const engine = new WithdrawalEngine({
    repository
  });

  // POST /api/skydrop/withdrawals
  router.post(
    '/',
    requireAuth,
    async (req, res, next) => {
      try {
        const withdrawal = await engine.requestWithdrawal({
          userId: req.user?.id,
          idempotencyKey: req.get('Idempotency-Key'),
          amountNgn: req.body?.amountNgn,
          destinationBankCode:
            req.body?.destinationBankCode,
          destinationAccountNumber:
            req.body?.destinationAccountNumber,
          destinationAccountName:
            req.body?.destinationAccountName
        });

        return res
          .status(withdrawal.existing ? 200 : 202)
          .json({
            ok: true,
            withdrawal,
            message:
              'Request recorded. A pending status does not mean the recipient has been credited.'
          });
      } catch (error) {
        return next(error);
      }
    }
  );

  // GET /api/skydrop/withdrawals/:reference
  router.get(
    '/:reference',
    requireAuth,
    async (req, res, next) => {
      try {
        const withdrawal =
          await repository.findByReference(
            req.params.reference
          );

        if (
          !withdrawal ||
          withdrawal.userId !== String(req.user.id)
        ) {
          return res.status(404).json({
            ok: false,
            error: 'Withdrawal not found.'
          });
        }

        return res.json({
          ok: true,
          withdrawal
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  // POST /api/skydrop/withdrawals/:reference/authorize
  router.post(
    '/:reference/authorize',
    requireAuth,
    async (req, res, next) => {
      try {
        const withdrawal =
          await engine.authorizeWithdrawal({
            userId: req.user?.id,
            reference: req.params.reference,
            authorizationCode:
              req.body?.authorizationCode
          });

        return res.json({
          ok: true,
          withdrawal,
          message:
            'Authorization request processed. Check provider status for final confirmation.'
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}

module.exports = {
  createSkydropWithdrawalRouter
};
