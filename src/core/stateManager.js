/**
 * State Manager
 *
 * Maintains the current state of a controlled simulation.
 */

class StateManager {
  constructor(initialState = {}) {
    this.state = this.clone(initialState);
    this.history = [];
    this.version = 0;
  }

  /**
   * Safely clone state.
   */
  clone(value) {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value));
  }

  /**
   * Get the complete state.
   */
  getState() {
    return this.clone(this.state);
  }

  /**
   * Get a specific property.
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Set a top-level property.
   */
  set(key, value) {
    const previous = this.clone(this.state[key]);

    this.state[key] = this.clone(value);

    this.version += 1;

    this.history.push({
      version: this.version,
      type: "SET",
      key,
      previous,
      value: this.clone(value),
      timestamp: new Date().toISOString()
    });

    return this.get(key);
  }

  /**
   * Update multiple properties.
   */
  update(updates = {}) {
    if (
      typeof updates !== "object" ||
      updates === null ||
      Array.isArray(updates)
    ) {
      throw new TypeError("updates must be an object");
    }

    for (const [key, value] of Object.entries(updates)) {
      this.state[key] = this.clone(value);
    }

    this.version += 1;

    this.history.push({
      version: this.version,
      type: "UPDATE",
      changes: this.clone(updates),
      timestamp: new Date().toISOString()
    });

    return this.getState();
  }

  /**
   * Delete a property.
   */
  delete(key) {
    if (!(key in this.state)) {
      return false;
    }

    const previous = this.clone(this.state[key]);

    delete this.state[key];

    this.version += 1;

    this.history.push({
      version: this.version,
      type: "DELETE",
      key,
      previous,
      timestamp: new Date().toISOString()
    });

    return true;
  }

  /**
   * Reset state.
   */
  reset(newState = {}) {
    this.state = this.clone(newState);
    this.version += 1;

    this.history.push({
      version: this.version,
      type: "RESET",
      timestamp: new Date().toISOString()
    });

    return this.getState();
  }

  /**
   * Get state history.
   */
  getHistory(limit = 50) {
    return this.clone(
      this.history.slice(-Math.max(1, limit))
    );
  }

  /**
   * Current state version.
   */
  getVersion() {
    return this.version;
  }

  /**
   * Check whether a property exists.
   */
  has(key) {
    return Object.prototype.hasOwnProperty.call(
      this.state,
      key
    );
  }
}

module.exports = StateManager;
