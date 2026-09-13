'use strict';

const express = require('express');

const {
  calculateRoute
} = require('../controllers/routingController');

const router = express.Router();

router.post('/calculate', calculateRoute);

module.exports = router;
