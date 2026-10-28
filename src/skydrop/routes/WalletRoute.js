'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');

const WalletController =
    require('../controllers/WalletController');

const router = express.Router();

router.get('/', authenticate, WalletController.getWallet);

module.exports = router;
