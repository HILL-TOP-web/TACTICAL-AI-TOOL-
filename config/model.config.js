/**
 * AI Model Configuration
 *
 * Defines how the AI model is loaded and how inference is performed.
 *
 * The actual model can later be connected to:
 * - A local ML model
 * - Ollama
 * - Hugging Face
 * - A custom Python inference server
 * - Another approved model provider
 */

module.exports = {
  model: {
    provider:
      process.env.AI_PROVIDER || "local",

    name:
      process.env.AI_MODEL_NAME || "tactical-training-model",

    version:
      process.env.AI_MODEL_VERSION || "1.0.0",

    endpoint:
      process.env.AI_MODEL_ENDPOINT || "http://localhost:11434",

    apiKey:
      process.env.AI_API_KEY || null
  },

  inference: {
    temperature:
      Number(process.env.AI_TEMPERATURE) || 0.2,

    maxTokens:
      Number(process.env.AI_MAX_TOKENS) || 2048,

    topP:
      Number(process.env.AI_TOP_P) || 0.9,

    timeoutMs:
      Number(process.env.AI_TIMEOUT_MS) || 60000,

    retries:
      Number(process.env.AI_RETRIES) || 2
  },

  context: {
    maxContextMessages:
      Number(process.env.MAX_CONTEXT_MESSAGES) || 20,

    maxContextTokens:
      Number(process.env.MAX_CONTEXT_TOKENS) || 8192,

    includeSimulationState:
      process.env.INCLUDE_SIMULATION_STATE !== "false",

    includeWeatherData:
      process.env.INCLUDE_WEATHER_DATA !== "false",

    includeTerrainData:
      process.env.INCLUDE_TERRAIN_DATA !== "false",

    includeLogisticsData:
      process.env.INCLUDE_LOGISTICS_DATA !== "false"
  },

  capabilities: {
    conversation: true,

    situationSummarization: true,

    terrainAnalysis: true,

    weatherAnalysis: true,

    logisticsAnalysis: true,

    routePlanningSimulation: true,

    decisionSupportSimulation: true,

    trainingExercises: true,

    afterActionReview: true,

    knowledgeBaseSearch: true
  },

  response: {
    format:
      process.env.AI_RESPONSE_FORMAT || "structured",

    includeConfidence:
      process.env.AI_INCLUDE_CONFIDENCE !== "false",

    includeReasoningSummary:
      process.env.AI_INCLUDE_REASONING_SUMMARY !== "false",

    includeWarnings:
      process.env.AI_INCLUDE_WARNINGS !== "false"
  },

  safety: {
    simulationOnly: true,

    refuseRealWorldOperationalInstructions: true,

    refuseRealWorldTargeting: true,

    refuseWeaponEmploymentInstructions: true,

    refuseInstructionsForCausingHarm: true,

    requireTrainingContext: true
  }
};
