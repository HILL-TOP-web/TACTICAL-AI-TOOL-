'use strict';

class DataAdapter {
  constructor(options = {}) {
    this.source = options.source || 'skydrop';
    this.target = options.target || 'tactical-ai';

    this.schemas = new Map();

    this.stats = {
      normalized: 0,
      validationFailures: 0
    };
  }

  registerSchema(name, schema) {
    if (!name || typeof name !== 'string') {
      throw new TypeError('Schema name must be a non-empty string.');
    }

    if (!schema || typeof schema !== 'object') {
      throw new TypeError('Schema must be an object.');
    }

    this.schemas.set(name, schema);

    return true;
  }

  getSchema(name) {
    return this.schemas.get(name) || null;
  }

  normalizeUser(user = {}) {
    if (!user || typeof user !== 'object') {
      throw new TypeError('User data must be an object.');
    }

    const normalized = {
      id: user.id || user.userId || null,
      username: user.username || null,
      displayName:
        user.displayName ||
        user.fullName ||
        user.name ||
        null,
      email: user.email || null,
      verified: Boolean(
        user.verified ||
        user.isVerified ||
        user.kycVerified
      ),
      active:
        user.active === undefined
          ? true
          : Boolean(user.active)
    };

    this.stats.normalized += 1;

    return normalized;
  }

  normalizeWallet(wallet = {}) {
    if (!wallet || typeof wallet !== 'object') {
      throw new TypeError('Wallet data must be an object.');
    }

    const normalizeAmount = value => {
      if (value === null || value === undefined) {
        return 0;
      }

      const number = Number(value);

      if (!Number.isFinite(number)) {
        return 0;
      }

      return number;
    };

    const normalized = {
      userId: wallet.userId || wallet.ownerId || null,

      balances: {
        SKD: normalizeAmount(
          wallet.SKD ??
          wallet.skd ??
          wallet.balances?.SKD
        ),

        USDT: normalizeAmount(
          wallet.USDT ??
          wallet.usdt ??
          wallet.balances?.USDT
        )
      },

      frozen: Boolean(
        wallet.frozen ||
        wallet.isFrozen
      ),

      withdrawalEnabled:
        wallet.withdrawalEnabled === undefined
          ? true
          : Boolean(wallet.withdrawalEnabled),

      tradingEnabled:
        wallet.tradingEnabled === undefined
          ? true
          : Boolean(wallet.tradingEnabled)
    };

    this.stats.normalized += 1;

    return normalized;
  }

  normalizeMining(mining = {}) {
    if (!mining || typeof mining !== 'object') {
      throw new TypeError('Mining data must be an object.');
    }

    const normalized = {
      userId: mining.userId || null,

      active: Boolean(
        mining.active ||
        mining.isMining
      ),

      totalMined: Number(mining.totalMined) || 0,

      sessionCount:
        Number(mining.sessionCount) ||
        Number(mining.totalSessions) ||
        0,

      miningTimeSeconds:
        Number(mining.miningTimeSeconds) ||
        Number(mining.totalMiningTimeSeconds) ||
        0,

      tasksCompleted:
        Number(mining.tasksCompleted) || 0,

      startedAt:
        mining.startedAt ||
        mining.lastMiningAt ||
        null,

      updatedAt:
        mining.updatedAt ||
        new Date().toISOString()
    };

    this.stats.normalized += 1;

    return normalized;
  }

  normalizeExchange(exchange = {}) {
    if (!exchange || typeof exchange !== 'object') {
      throw new TypeError('Exchange data must be an object.');
    }

    const normalized = {
      userId: exchange.userId || null,

      pair:
        exchange.pair ||
        'SKD/USDT',

      totalSwaps:
        Number(exchange.totalSwaps) || 0,

      successfulSwaps:
        Number(exchange.successfulSwaps) || 0,

      failedSwaps:
        Number(exchange.failedSwaps) || 0,

      totalSKDSold:
        Number(exchange.totalSKDSold) || 0,

      totalUSDTReceived:
        Number(exchange.totalUSDTReceived) || 0,

      lastSwapAt:
        exchange.lastSwapAt || null
    };

    this.stats.normalized += 1;

    return normalized;
  }

  normalizeTransaction(transaction = {}) {
    if (!transaction || typeof transaction !== 'object') {
      throw new TypeError('Transaction data must be an object.');
    }

    const normalized = {
      id:
        transaction.id ||
        transaction.transactionId ||
        null,

      userId:
        transaction.userId ||
        transaction.ownerId ||
        null,

      type:
        transaction.type ||
        'unknown',

      asset:
        transaction.asset ||
        null,

      amount:
        Number(transaction.amount) || 0,

      status:
        transaction.status ||
        'pending',

      createdAt:
        transaction.createdAt ||
        transaction.timestamp ||
        new Date().toISOString(),

      metadata:
        transaction.metadata &&
        typeof transaction.metadata === 'object'
          ? {
              ...transaction.metadata
            }
          : {}
    };

    this.stats.normalized += 1;

    return normalized;
  }

  validateRequired(data, fields = []) {
    if (!data || typeof data !== 'object') {
      this.stats.validationFailures += 1;
      return {
        valid: false,
        missing: fields
      };
    }

    const missing = fields.filter(field => {
      return (
        data[field] === undefined ||
        data[field] === null ||
        data[field] === ''
      );
    });

    if (missing.length > 0) {
      this.stats.validationFailures += 1;
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  sanitize(data, options = {}) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const blockedFields = new Set(
      options.blockedFields || [
        'password',
        'passwordHash',
        'privateKey',
        'secret',
        'accessToken',
        'refreshToken'
      ]
    );

    const output = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      if (blockedFields.has(key)) {
        continue;
      }

      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        output[key] = this.sanitize(value, options);
      } else if (Array.isArray(value)) {
        output[key] = value.map(item =>
          item && typeof item === 'object'
            ? this.sanitize(item, options)
            : item
        );
      } else {
        output[key] = value;
      }
    }

    return output;
  }

  normalize(type, data) {
    switch (type) {
      case 'user':
        return this.normalizeUser(data);

      case 'wallet':
        return this.normalizeWallet(data);

      case 'mining':
        return this.normalizeMining(data);

      case 'exchange':
        return this.normalizeExchange(data);

      case 'transaction':
        return this.normalizeTransaction(data);

      default:
        throw new Error(
          `Unsupported data type "${type}".`
        );
    }
  }

  prepare(type, data, options = {}) {
    const normalized = this.normalize(type, data);

    const sanitized =
      options.sanitize === false
        ? normalized
        : this.sanitize(normalized, options);

    return {
      source: this.source,
      target: this.target,
      type,
      data: sanitized,
      timestamp: new Date().toISOString()
    };
  }

  getStats() {
    return {
      source: this.source,
      target: this.target,
      schemas: Array.from(this.schemas.keys()),
      stats: {
        ...this.stats
      }
    };
  }

  resetStats() {
    this.stats = {
      normalized: 0,
      validationFailures: 0
    };
  }
}

module.exports = DataAdapter;
