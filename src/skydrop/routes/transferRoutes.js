'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');

const TransferController =
    require('../controllers/TransferController');

const router = express.Router();

router.get('/', authenticate, TransferController.getTransfers);

router.post('/', authenticate, TransferController.createTransfer);

module.exports = router;
