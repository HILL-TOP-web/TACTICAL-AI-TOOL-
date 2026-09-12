/**
 * Tactical AI - Logger
 * Centralized application logging utility.
 */

const LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  FATAL: 50
};

const configuredLevel =
  String(process.env.LOG_LEVEL || "INFO").toUpperCase();

const MIN_LEVEL = LEVELS[configuredLevel] || LEVELS.INFO;

function timestamp() {
  return new Date().toISOString();
}

function normalizeMeta(meta) {
  if (meta === undefined || meta === null) {
    return {};
  }

  if (meta instanceof Error) {
    return {
      error: {
        name: meta.name,
        message: meta.message,
        stack: meta.stack
      }
    };
  }

  if (typeof meta === "object") {
    return meta;
  }

  return { value: meta };
}

function write(level, message, meta = {}) {
  if (LEVELS[level] < MIN_LEVEL) {
    return;
  }

  const entry = {
    timestamp: timestamp(),
    level,
    message: String(message),
    ...normalizeMeta(meta)
  };

  const output = JSON.stringify(entry);

  if (level === "ERROR" || level === "FATAL") {
    console.error(output);
  } else if (level === "WARN") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

const logger = {
  debug(message, meta) {
    write("DEBUG", message, meta);
  },

  info(message, meta) {
    write("INFO", message, meta);
  },

  warn(message, meta) {
    write("WARN", message, meta);
  },

  error(message, meta) {
    write("ERROR", message, meta);
  },

  fatal(message, meta) {
    write("FATAL", message, meta);
  },

  child(context = {}) {
    return {
      debug: (message, meta = {}) =>
        write("DEBUG", message, { ...context, ...normalizeMeta(meta) }),

      info: (message, meta = {}) =>
        write("INFO", message, { ...context, ...normalizeMeta(meta) }),

      warn: (message, meta = {}) =>
        write("WARN", message, { ...context, ...normalizeMeta(meta) }),

      error: (message, meta = {}) =>
        write("ERROR", message, { ...context, ...normalizeMeta(meta) }),

      fatal: (message, meta = {}) =>
        write("FATAL", message, { ...context, ...normalizeMeta(meta) })
    };
  }
};

module.exports = logger;
