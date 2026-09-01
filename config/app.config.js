/**
 * Application Configuration
 *
 * Central configuration for the tactical AI application.
 */

const path = require("path");

const APP_ROOT = path.resolve(__dirname, "..");

module.exports = {
  app: {
    name: process.env.APP_NAME || "Tactical AI",
    version: process.env.APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",

    rootDir: APP_ROOT,

    host: process.env.APP_HOST || "0.0.0.0",
    port: Number(process.env.PORT) || 3000,

    timezone: process.env.TZ || "UTC"
  },

  api: {
    prefix: process.env.API_PREFIX || "/api",

    version: process.env.API_VERSION || "v1",

    requestTimeoutMs:
      Number(process.env.API_REQUEST_TIMEOUT_MS) || 30000,

    bodyLimit:
      process.env.API_BODY_LIMIT || "2mb"
  },

  security: {
    corsOrigin:
      process.env.CORS_ORIGIN || "http://localhost:3000",

    enableHelmet:
      process.env.ENABLE_HELMET !== "false",

    trustProxy:
      process.env.TRUST_PROXY === "true"
  },

  paths: {
    config: path.join(APP_ROOT, "config"),
    data: path.join(APP_ROOT, "data"),
    models: path.join(APP_ROOT, "models"),
    services: path.join(APP_ROOT, "services"),
    routes: path.join(APP_ROOT, "routes"),
    controllers: path.join(APP_ROOT, "controllers"),
    middleware: path.join(APP_ROOT, "middleware"),
    logs: path.join(APP_ROOT, "logs"),
    tests: path.join(APP_ROOT, "tests")
  },

  features: {
    simulation:
      process.env.ENABLE_SIMULATION !== "false",

    terrainAnalysis:
      process.env.ENABLE_TERRAIN_ANALYSIS !== "false",

    weatherAnalysis:
      process.env.ENABLE_WEATHER_ANALYSIS !== "false",

    logistics:
      process.env.ENABLE_LOGISTICS !== "false",

    afterActionReview:
      process.env.ENABLE_AFTER_ACTION_REVIEW !== "false",

    knowledgeBase:
      process.env.ENABLE_KNOWLEDGE_BASE !== "false"
  }
};
