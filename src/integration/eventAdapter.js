'use strict';

const EventEmitter = require('events');
const crypto = require('crypto');

class EventAdapter extends EventEmitter {
  constructor(options = {}) {
    super();

    this.source = options.source || 'unknown';
    this.target = options.target || 'tactical-ai';

    this.transformers = new Map();
    this.history = [];

    this.maxHistory =
      Number.isInteger(options.maxHistory) && options.maxHistory > 0
        ? options.maxHistory
        : 1000;

    this.stats = {
      adapted: 0,
      failed: 0
    };
  }

  registerTransformer(eventType, transformer) {
    if (!eventType || typeof eventType !== 'string') {
      throw new TypeError('eventType must be a non-empty string.');
    }

    if (typeof transformer !== 'function') {
      throw new TypeError('transformer must be a function.');
    }

    this.transformers.set(eventType, transformer);

    return true;
  }

  unregisterTransformer(eventType) {
    return this.transformers.delete(eventType);
  }

  getTransformer(eventType) {
    return (
      this.transformers.get(eventType) ||
      this.transformers.get('*') ||
      null
    );
  }

  adapt(event) {
    if (!event || typeof event !== 'object') {
      this.stats.failed += 1;
      throw new TypeError('A valid event object is required.');
    }

    if (!event.type || typeof event.type !== 'string') {
      this.stats.failed += 1;
      throw new Error('Event type is required.');
    }

    const transformer = this.getTransformer(event.type);

    try {
      const transformedPayload = transformer
        ? transformer(event.payload || {}, event)
        : event.payload || {};

      const adaptedEvent = {
        id: crypto.randomUUID(),
        source: event.source || this.source,
        target: event.target || this.target,
        type: event.type,
        payload: transformedPayload,
        metadata: {
          ...(event.metadata || {}),
          adaptedBy: 'EventAdapter',
          originalEventId: event.id || null
        },
        timestamp: event.timestamp || new Date().toISOString(),
        adaptedAt: new Date().toISOString()
      };

      this.stats.adapted += 1;

      this.addToHistory(adaptedEvent);

      this.emit('adapted', adaptedEvent);
      this.emit(`adapted:${event.type}`, adaptedEvent);

      return adaptedEvent;
    } catch (error) {
      this.stats.failed += 1;

      this.emit('adaptation:error', {
        event,
        message: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  adaptMany(events) {
    if (!Array.isArray(events)) {
      throw new TypeError('events must be an array.');
    }

    return events.map(event => this.adapt(event));
  }

  addToHistory(event) {
    this.history.push(event);

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getHistory(limit = 50) {
    const safeLimit = Math.max(
      1,
      Math.min(Number(limit) || 50, this.maxHistory)
    );

    return this.history.slice(-safeLimit);
  }

  clearHistory() {
    this.history = [];
  }

  getStats() {
    return {
      source: this.source,
      target: this.target,
      registeredTransformers: Array.from(
        this.transformers.keys()
      ),
      historySize: this.history.length,
      stats: {
        ...this.stats
      }
    };
  }
}

module.exports = EventAdapter;
