'use strict';

class RateLimiter {
  constructor(options = {}) {
    this.windowMs =
      Number(options.windowMs) || 60 * 1000;

    this.maxRequests =
      Number(options.maxRequests) || 60;

    this.clients = new Map();
  }

  /**
   * Get or create request information for a client.
   */
  getClient(clientId) {
    if (
      typeof clientId !== 'string' ||
      clientId.trim().length === 0
    ) {
      throw new Error(
        'Client ID is required.'
      );
    }

    const id = clientId.trim();

    const now = Date.now();

    let record =
      this.clients.get(id);

    if (!record) {
      record = {
        count: 0,
        windowStart: now,
        blockedUntil: 0
      };

      this.clients.set(id, record);
    }

    return {
      id,
      record
    };
  }

  /**
   * Check whether a client may continue.
   */
  check(clientId) {
    const {
      id,
      record
    } = this.getClient(clientId);

    const now = Date.now();

    if (
      record.blockedUntil > now
    ) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs:
          record.blockedUntil - now
      };
    }

    if (
      now - record.windowStart >=
      this.windowMs
    ) {
      record.count = 0;
      record.windowStart = now;
    }

    const allowed =
      record.count < this.maxRequests;

    return {
      allowed,
      remaining: Math.max(
        0,
        this.maxRequests - record.count
      ),
      retryAfterMs: allowed
        ? 0
        : this.windowMs -
          (now - record.windowStart)
    };
  }

  /**
   * Record a request.
   */
  consume(clientId) {
    const {
      id,
      record
    } = this.getClient(clientId);

    const result =
      this.check(id);

    if (!result.allowed) {
      return {
        ...result,
        consumed: false
      };
    }

    record.count += 1;

    this.clients.set(id, record);

    return {
      allowed: true,
      consumed: true,
      remaining:
        Math.max(
          0,
          this.maxRequests - record.count
        ),
      retryAfterMs: 0
    };
  }

  /**
   * Temporarily block a client.
   */
  block(clientId, durationMs) {
    const {
      id,
      record
    } = this.getClient(clientId);

    const duration =
      Number(durationMs);

    if (
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      throw new Error(
        'Block duration must be greater than zero.'
      );
    }

    record.blockedUntil =
      Date.now() + duration;

    this.clients.set(id, record);

    return {
      clientId: id,
      blocked: true,
      blockedUntil:
        new Date(
          record.blockedUntil
        ).toISOString()
    };
  }

  /**
   * Reset a client.
   */
  reset(clientId) {
    const id =
      String(clientId).trim();

    this.clients.delete(id);

    return {
      success: true,
      clientId: id
    };
  }

  /**
   * Remove expired clients.
   */
  cleanup() {
    const now = Date.now();

    for (const [
      clientId,
      record
    ] of this.clients.entries()) {
      const expired =
        now - record.windowStart >=
        this.windowMs;

      const unblocked =
        record.blockedUntil <= now;

      if (
        expired &&
        unblocked
      ) {
        this.clients.delete(clientId);
      }
    }

    return true;
  }

  /**
   * Return current configuration.
   */
  getConfig() {
    return {
      windowMs: this.windowMs,
      maxRequests: this.maxRequests,
      trackedClients:
        this.clients.size
    };
  }
}

module.exports = RateLimiter;
