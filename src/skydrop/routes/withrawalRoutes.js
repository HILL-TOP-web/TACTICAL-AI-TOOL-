'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');

const WithdrawalController =
    require('../controllers/WithdrawalController');

const router = express.Router();

router.get('/', authenticate, WithdrawalController.getWithdrawals);

router.post('/', authenticate, WithdrawalController.createWithdrawal);

module.exports = router;
