'use strict';

const express = require('express');

const {
  getWeather,
  analyzeWeather
} = require('../controllers/weatherController');

const router = express.Router();

router.get('/', getWeather);
router.post('/analyze', analyzeWeather);

module.exports = router;
