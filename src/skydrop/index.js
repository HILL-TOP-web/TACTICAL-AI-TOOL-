'use strict';

const express = require('express');

const dashboardRoutes = require('./routes/dashboardRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const transferRoutes = require('./routes/transferRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');

const router = express.Router();

router.use('/dashboard', dashboardRoutes);
router.use('/wallet', walletRoutes);
router.use('/transactions', transactionRoutes);
router.use('/transfers', transferRoutes);
router.use('/withdrawals', withdrawalRoutes);

module.exports = router;
