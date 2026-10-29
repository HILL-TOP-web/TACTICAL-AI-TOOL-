'use strict';

const express = require('express');

const controller = require('../controllers/financeController');
const { requireAuth } = require('../../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

router.get('/dashboard', controller.dashboard);

router.get('/wallet', controller.wallet);

router.get('/transactions', controller.transactions);

router.get('/transfers', controller.transfers);

router.post('/transfers', controller.createTransfer);

router.get('/withdrawals', controller.withdrawals);

router.post('/withdrawals', controller.createWithdrawal);

module.exports = router;
