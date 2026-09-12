/**
 * Tactical AI - Application Errors
 *
 * Provides standardized error classes for the application.
 */

class AppError extends Error {
  constructor(message, options = {}) {
    super(message);

    this.name = options.name || "AppError";
    this.code = options.code || "APP_ERROR";
    this.statusCode = options.statusCode || 500;
    this.details = options.details || null;
    this.isOperational =
      options.isOperational !== undefined
        ? options.isOperational
        : true;

    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      isOperational: this.isOperational
    };
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed", details = null) {
    super(message, {
      name: "ValidationError",
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details
    });
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found", details = null) {
    super(message, {
      name: "NotFoundError",
      code: "NOT_FOUND",
      statusCode: 404,
      details
    });
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", details = null) {
    super(message, {
      name: "UnauthorizedError",
      code: "UNAUTHORIZED",
      statusCode: 401,
      details
    });
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Access forbidden", details = null) {
    super(message, {
      name: "ForbiddenError",
      code: "FORBIDDEN",
      statusCode: 403,
      details
    });
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource conflict", details = null) {
    super(message, {
      name: "ConflictError",
      code: "CONFLICT",
      statusCode: 409,
      details
    });
  }
}

class ConfigurationError extends AppError {
  constructor(message = "Invalid application configuration", details = null) {
    super(message, {
      name: "ConfigurationError",
      code: "CONFIGURATION_ERROR",
      statusCode: 500,
      details
    });
  }
}

class SimulationError extends AppError {
  constructor(message = "Simulation error", details = null) {
    super(message, {
      name: "SimulationError",
      code: "SIMULATION_ERROR",
      statusCode: 500,
      details
    });
  }
}

class KnowledgeError extends AppError {
  constructor(message = "Knowledge processing error", details = null) {
    super(message, {
      name: "KnowledgeError",
      code: "KNOWLEDGE_ERROR",
      statusCode: 500,
      details
    });
  }
}

class RoutingError extends AppError {
  constructor(message = "Routing calculation failed", details = null) {
    super(message, {
      name: "RoutingError",
      code: "ROUTING_ERROR",
      statusCode: 500,
      details
    });
  }
}

function isAppError(error) {
  return error instanceof AppError;
}

function normalizeError(error) {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, {
      name: error.name || "Error",
      code: "INTERNAL_ERROR",
      statusCode: 500,
      isOperational: false,
      details: {
        originalStack: error.stack
      }
    });
  }

  return new AppError(String(error), {
    code: "UNKNOWN_ERROR",
    statusCode: 500,
    isOperational: false
  });
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ConfigurationError,
  SimulationError,
  KnowledgeError,
  RoutingError,
  isAppError,
  normalizeError
};
