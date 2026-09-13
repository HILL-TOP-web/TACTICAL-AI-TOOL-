'use strict';

const express = require('express');

const {
  getSimulationStatus,
  startSimulation,
  stopSimulation,
  getSimulationState
} = require('../controllers/simulationController');

const router = express.Router();

router.get('/status', getSimulationStatus);
router.get('/state', getSimulationState);

router.post('/start', startSimulation);
router.post('/stop', stopSimulation);

module.exports = router;
