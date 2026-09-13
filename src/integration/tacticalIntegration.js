'use strict';

const EventEmitter = require('events');
const crypto = require('crypto');

class TacticalIntegration extends EventEmitter {
  constructor(options = {}) {
    super();

    this.name = options.name || 'TacticalAI-SkyDrop Integration';
    this.version = options.version || '1.0.0';

    this.connected = false;
    this.startedAt = null;
    this.lastHeartbeatAt = null;

    this.components = new Map();
    this.metrics = {
      eventsReceived: 0,
      eventsEmitted: 0,
      dataRequests: 0,
      errors: 0
    };
  }

  registerComponent(name, component) {
    if (!name || typeof name !== 'string') {
      throw new TypeError('Component name must be a non-empty string.');
    }

    if (!component) {
      throw new TypeError(`Component "${name}" is required.`);
    }

    this.components.set(name, component);

    this.emit('component:registered', {
      name,
      registeredAt: new Date().toISOString()
    });

    return true;
  }

  unregisterComponent(name) {
    const removed = this.components.delete(name);

    if (removed) {
      this.emit('component:unregistered', {
        name,
        removedAt: new Date().toISOString()
      });
    }

    return removed;
  }

  getComponent(name) {
    return this.components.get(name) || null;
  }

  hasComponent(name) {
    return this.components.has(name);
  }

  listComponents() {
    return Array.from(this.components.keys());
  }

  connect() {
    if (this.connected) {
      return this.getStatus();
    }

    this.connected = true;
    this.startedAt = new Date().toISOString();
    this.lastHeartbeatAt = this.startedAt;

    this.emit('integration:connected', {
      name: this.name,
      version: this.version,
      connectedAt: this.startedAt
    });

    return this.getStatus();
  }

  disconnect() {
    if (!this.connected) {
      return this.getStatus();
    }

    this.connected = false;

    this.emit('integration:disconnected', {
      disconnectedAt: new Date().toISOString()
    });

    return this.getStatus();
  }

  heartbeat() {
    if (!this.connected) {
      return false;
    }

    this.lastHeartbeatAt = new Date().toISOString();

    this.emit('integration:heartbeat', {
      timestamp: this.lastHeartbeatAt
    });

    return true;
  }

  publishEvent(type, payload = {}, metadata = {}) {
    if (!type || typeof type !== 'string') {
      throw new TypeError('Event type must be a non-empty string.');
    }

    const event = {
      id: crypto.randomUUID(),
      type,
      payload,
      metadata,
      source: metadata.source || 'tactical-ai',
      timestamp: new Date().toISOString()
    };

    this.metrics.eventsEmitted += 1;

    this.emit('event', event);
    this.emit(type, event);

    return event;
  }

  receiveEvent(event) {
    if (!event || typeof event !== 'object') {
      throw new TypeError('A valid event object is required.');
    }

    if (!event.type) {
      throw new Error('Event type is required.');
    }

    this.metrics.eventsReceived += 1;

    this.emit('event:received', event);

    return event;
  }

  requestData(componentName, method, ...args) {
    this.metrics.dataRequests += 1;

    const component = this.getComponent(componentName);

    if (!component) {
      this.metrics.errors += 1;
      throw new Error(`Integration component "${componentName}" is not registered.`);
    }

    if (typeof component[method] !== 'function') {
      this.metrics.errors += 1;
      throw new Error(
        `Method "${method}" does not exist on component "${componentName}".`
      );
    }

    try {
      return component[method](...args);
    } catch (error) {
      this.metrics.errors += 1;
      this.emit('integration:error', {
        component: componentName,
        method,
        message: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  getStatus() {
    return {
      name: this.name,
      version: this.version,
      connected: this.connected,
      startedAt: this.startedAt,
      lastHeartbeatAt: this.lastHeartbeatAt,
      components: this.listComponents(),
      metrics: {
        ...this.metrics
      }
    };
  }

  resetMetrics() {
    this.metrics = {
      eventsReceived: 0,
      eventsEmitted: 0,
      dataRequests: 0,
      errors: 0
    };
  }
}

module.exports = TacticalIntegration;
