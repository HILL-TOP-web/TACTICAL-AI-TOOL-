/**
 * Event Bus
 *
 * Lightweight internal event system for the simulation.
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Register a listener.
   */
  on(eventName, handler) {
    if (typeof handler !== "function") {
      throw new TypeError("Event handler must be a function");
    }

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName).add(handler);

    return () => this.off(eventName, handler);
  }

  /**
   * Register a listener that runs once.
   */
  once(eventName, handler) {
    const wrapper = (...args) => {
      this.off(eventName, wrapper);
      return handler(...args);
    };

    return this.on(eventName, wrapper);
  }

  /**
   * Remove a listener.
   */
  off(eventName, handler) {
    const handlers = this.listeners.get(eventName);

    if (!handlers) {
      return false;
    }

    const removed = handlers.delete(handler);

    if (handlers.size === 0) {
      this.listeners.delete(eventName);
    }

    return removed;
  }

  /**
   * Emit an event.
   */
  emit(eventName, payload = {}) {
    const handlers = this.listeners.get(eventName);

    if (!handlers) {
      return;
    }

    for (const handler of [...handlers]) {
      try {
        handler(payload);
      } catch (error) {
        console.error(
          `Event handler error for "${eventName}":`,
          error
        );
      }
    }
  }

  /**
   * Emit an event asynchronously.
   */
  async emitAsync(eventName, payload = {}) {
    const handlers = this.listeners.get(eventName);

    if (!handlers) {
      return;
    }

    await Promise.all(
      [...handlers].map(async (handler) => {
        try {
          await handler(payload);
        } catch (error) {
          console.error(
            `Async event handler error for "${eventName}":`,
            error
          );
        }
      })
    );
  }

  /**
   * Remove every listener.
   */
  clear() {
    this.listeners.clear();
  }

  /**
   * Return registered event names.
   */
  events() {
    return [...this.listeners.keys()];
  }

  /**
   * Return listener count.
   */
  listenerCount(eventName) {
    return this.listeners.get(eventName)?.size || 0;
  }
}

module.exports = EventBus;
