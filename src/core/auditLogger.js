/**
 * Audit Logger
 *
 * Records important simulation and AI events.
 */

class AuditLogger {
  constructor(options = {}) {
    this.maxEntries =
      Number(options.maxEntries ?? 5000);

    this.entries = [];

    this.enabled =
      options.enabled !== false;
  }

  /**
   * Record an event.
   */
  log(event, data = {}, metadata = {}) {
    if (!this.enabled) {
      return null;
    }

    const entry = {
      id: this.generateId(),

      event,

      timestamp:
        new Date().toISOString(),

      data: this.clone(data),

      metadata: this.clone(metadata)
    };

    this.entries.push(entry);

    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    return this.clone(entry);
  }

  /**
   * Record an error.
   */
  error(error, metadata = {}) {
    return this.log(
      "error",
      {
        message:
          error?.message ||
          String(error),

        name:
          error?.name ||
          "Error"
      },
      metadata
    );
  }

  /**
   * Find entries by event name.
   */
  findByEvent(event) {
    return this.entries
      .filter((entry) => entry.event === event)
      .map((entry) => this.clone(entry));
  }

  /**
   * Get latest entries.
   */
  latest(limit = 50) {
    return this.entries
      .slice(-Math.max(1, limit))
      .map((entry) => this.clone(entry));
  }

  /**
   * Get all entries.
   */
  all() {
    return this.entries.map(
      (entry) => this.clone(entry)
    );
  }

  /**
   * Clear audit history.
   */
  clear() {
    this.entries = [];
  }

  /**
   * Number of stored entries.
   */
  count() {
    return this.entries.length;
  }

  /**
   * Enable logging.
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable logging.
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Generate an audit ID.
   */
  generateId() {
    return `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  /**
   * Clone data safely.
   */
  clone(value) {
    if (value === undefined) {
      return undefined;
    }

    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch {
      return {
        value: String(value)
      };
    }
  }
}

module.exports = AuditLogger;
