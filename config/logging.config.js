/**
 * Logging Configuration
 *
 * Centralized logging configuration.
 */

const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

module.exports = {
  logging: {
    level:
      process.env.LOG_LEVEL || "info",

    format:
      process.env.LOG_FORMAT || "json",

    timestamp:
      process.env.LOG_TIMESTAMP !== "false",

    console:
      process.env.LOG_CONSOLE !== "false",

    file:
      process.env.LOG_FILE !== "false",

    directory:
      process.env.LOG_DIRECTORY ||
      path.join(ROOT_DIR, "logs"),

    filename:
      process.env.LOG_FILENAME ||
      "tactical-ai.log",

    maxSize:
      process.env.LOG_MAX_SIZE || "10m",

    maxFiles:
      Number(process.env.LOG_MAX_FILES) || 5
  },

  categories: {
    application: true,

    api: true,

    authentication: true,

    model: true,

    inference: true,

    simulation: true,

    terrain: true,

    weather: true,

    logistics: true,

    knowledgeBase: true,

    errors: true
  },

  development: {
    prettyPrint:
      process.env.NODE_ENV === "development",

    colorize:
      process.env.NODE_ENV === "development",

    includeStackTrace:
      process.env.NODE_ENV === "development"
  },

  production: {
    prettyPrint: false,

    colorize: false,

    includeStackTrace: false
  },

  privacy: {
    redactApiKeys: true,

    redactPasswords: true,

    redactTokens: true,

    redactAuthorizationHeaders: true,

    redactPersonalData: true
  },

  audit: {
    enabled:
      process.env.AUDIT_LOGGING !== "false",

    recordModelRequests: true,

    recordSimulationEvents: true,

    recordConfigurationChanges: true,

    recordAuthenticationEvents: true
  }
};
