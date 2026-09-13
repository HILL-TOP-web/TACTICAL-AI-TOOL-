'use strict';

const express = require('express');

const {
  calculateLogistics,
  getLogisticsStatus
} = require('../controllers/logisticsController');

const router = express.Router();

router.post('/calculate', calculateLogistics);
router.get('/status', getLogisticsStatus);

module.exports = router;
