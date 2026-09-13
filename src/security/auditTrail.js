'use strict';

const crypto = require('crypto');

class AuditTrail {
  constructor(options = {}) {
    this.entries = [];
    this.maxEntries =
      Number(options.maxEntries) || 10000;
  }

  /**
   * Create an audit entry.
   */
  record({
    userId = null,
    action,
    type = 'system',
    status = 'success',
    resource = null,
    transactionId = null,
    metadata = {},
    ip = null
  } = {}) {
    if (
      typeof action !== 'string' ||
      action.trim().length === 0
    ) {
      throw new Error(
        'Audit action is required.'
      );
    }

    const entry = {
      auditId:
        crypto.randomUUID(),

      timestamp:
        new Date().toISOString(),

      userId,

      action:
        action.trim(),

      type,

      status,

      resource,

      transactionId,

      ip,

      metadata:
        this.sanitizeMetadata(metadata)
    };

    this.entries.push(entry);

    if (
      this.entries.length >
      this.maxEntries
    ) {
      this.entries.shift();
    }

    return this.clone(entry);
  }

  /**
   * Record a transaction event.
   */
  recordTransaction({
    userId,
    transactionId,
    action,
    status = 'success',
    metadata = {}
  }) {
    return this.record({
      userId,
      transactionId,
      action,
      status,
      type: 'transaction',
      metadata
    });
  }

  /**
   * Record a security event.
   */
  recordSecurityEvent({
    userId = null,
    action,
    status = 'warning',
    metadata = {},
    ip = null
  }) {
    return this.record({
      userId,
      action,
      status,
      type: 'security',
      metadata,
      ip
    });
  }

  /**
   * Find audit records for a user.
   */
  findByUser(userId) {
    return this.entries
      .filter(
        entry => entry.userId === userId
      )
      .map(entry => this.clone(entry));
  }

  /**
   * Find a transaction's audit trail.
   */
  findByTransaction(
    transactionId
  ) {
    return this.entries
      .filter(
        entry =>
          entry.transactionId ===
          transactionId
      )
      .map(entry => this.clone(entry));
  }

  /**
   * Find records by action.
   */
  findByAction(action) {
    return this.entries
      .filter(
        entry =>
          entry.action === action
      )
      .map(entry => this.clone(entry));
  }

  /**
   * Return recent audit events.
   */
  recent(limit = 50) {
    const size =
      Math.max(
        1,
        Math.min(
          Number(limit) || 50,
          this.maxEntries
        )
      );

    return this.entries
      .slice(-size)
      .reverse()
      .map(entry => this.clone(entry));
  }

  /**
   * Count events by status.
   */
  countByStatus(status) {
    return this.entries.filter(
      entry =>
        entry.status === status
    ).length;
  }

  /**
   * Remove sensitive values from metadata.
   */
  sanitizeMetadata(metadata) {
    if (
      !metadata ||
      typeof metadata !== 'object'
    ) {
      return {};
    }

    const sensitiveKeys = new Set([
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'privateKey',
      'seedPhrase',
      'mnemonic',
      'apiKey'
    ]);

    const sanitized = {};

    for (const [
      key,
      value
    ] of Object.entries(metadata)) {
      if (
        sensitiveKeys.has(key)
      ) {
        sanitized[key] =
          '[REDACTED]';
      } else {
        sanitized[key] =
          value;
      }
    }

    return sanitized;
  }

  /**
   * Export audit records.
   */
  export() {
    return this.entries.map(
      entry => this.clone(entry)
    );
  }

  /**
   * Clear the current in-memory audit trail.
   */
  clear() {
    this.entries = [];

    return {
      success: true
    };
  }

  /**
   * Clone an object.
   */
  clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }
}

module.exports = AuditTrail;
