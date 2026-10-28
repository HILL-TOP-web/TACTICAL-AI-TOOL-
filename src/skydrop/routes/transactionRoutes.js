'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');

const TransactionController =
    require('../controllers/TransactionController');

const router = express.Router();

router.get('/', authenticate, TransactionController.getTransactions);

module.exports = router;
