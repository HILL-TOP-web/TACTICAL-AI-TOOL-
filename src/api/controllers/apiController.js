'use strict';

let simulationState = {
  running: false,
  startedAt: null,
  stoppedAt: null
};

function getSimulationStatus(req, res) {
  res.json({
    success: true,
    simulation: simulationState
  });
}

function getSimulationState(req, res) {
  res.json({
    success: true,
    state: simulationState
  });
}

function startSimulation(req, res) {
  if (simulationState.running) {
    return res.status(409).json({
      success: false,
      error: 'Simulation is already running'
    });
  }

  simulationState = {
    running: true,
    startedAt: new Date().toISOString(),
    stoppedAt: null
  };

  res.status(201).json({
    success: true,
    message: 'Training simulation started',
    simulation: simulationState
  });
}

function stopSimulation(req, res) {
  if (!simulationState.running) {
    return res.status(409).json({
      success: false,
      error: 'Simulation is not running'
    });
  }

  simulationState.running = false;
  simulationState.stoppedAt = new Date().toISOString();

  res.json({
    success: true,
    message: 'Training simulation stopped',
    simulation: simulationState
  });
}

module.exports = {
  getSimulationStatus,
  startSimulation,
  stopSimulation,
  getSimulationState
};
