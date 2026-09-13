'use strict';

const express = require('express');

const {
  startTraining,
  getTrainingStatus,
  submitTrainingResult
} = require('../controllers/trainingController');

const router = express.Router();

router.post('/start', startTraining);
router.get('/status', getTrainingStatus);
router.post('/result', submitTrainingResult);

module.exports = router;
