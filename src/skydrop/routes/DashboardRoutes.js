'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');

const DashboardController =
    require('../controllers/DashboardController');

const router = express.Router();

router.get('/', authenticate, DashboardController.getDashboard);

module.exports = router;
