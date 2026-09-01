/**
 * Simulation Configuration
 *
 * Configuration for controlled, fictional training simulations.
 *
 * IMPORTANT:
 * These settings are intended for simulation/training environments.
 * They should not be interpreted as real-world operational parameters.
 */

module.exports = {
  simulation: {
    enabled:
      process.env.SIMULATION_ENABLED !== "false",

    mode:
      process.env.SIMULATION_MODE || "training",

    scenarioName:
      process.env.SCENARIO_NAME || "default-training-scenario",

    seed:
      process.env.SIMULATION_SEED
        ? Number(process.env.SIMULATION_SEED)
        : 12345,

    tickRateMs:
      Number(process.env.SIMULATION_TICK_RATE_MS) || 1000,

    maxDurationSeconds:
      Number(process.env.SIMULATION_MAX_DURATION_SECONDS) || 3600
  },

  environment: {
    type:
      process.env.SIMULATION_ENVIRONMENT || "fictional",

    mapWidth:
      Number(process.env.MAP_WIDTH) || 100,

    mapHeight:
      Number(process.env.MAP_HEIGHT) || 100,

    elevationEnabled:
      process.env.ELEVATION_ENABLED !== "false",

    weatherEnabled:
      process.env.SIMULATION_WEATHER_ENABLED !== "false",

    dayNightCycle:
      process.env.DAY_NIGHT_CYCLE !== "false"
  },

  agents: {
    maxAgents:
      Number(process.env.MAX_SIMULATION_AGENTS) || 100,

    allowAutonomousAgents:
      process.env.ALLOW_AUTONOMOUS_AGENTS !== "false",

    decisionIntervalMs:
      Number(process.env.AGENT_DECISION_INTERVAL_MS) || 2000
  },

  resources: {
    fuelEnabled:
      process.env.FUEL_SIMULATION !== "false",

    medicalEnabled:
      process.env.MEDICAL_SIMULATION !== "false",

    foodEnabled:
      process.env.FOOD_SIMULATION !== "false",

    communicationsEnabled:
      process.env.COMMUNICATION_SIMULATION !== "false"
  },

  scoring: {
    enabled:
      process.env.SIMULATION_SCORING !== "false",

    completionBonus: 100,

    penalties: {
      simulatedLoss: 10,
      failedObjective: 25,
      ruleViolation: 50
    }
  },

  safety: {
    fictionalWorldOnly: true,

    disableRealWorldTargeting: true,

    disableRealWorldCoordinates: true,

    requireSimulationMode: true,

    allowLiveOperations: false
  }
};
