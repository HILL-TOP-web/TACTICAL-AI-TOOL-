'use strict';

const EventEmitter = require('events');

class SkyDropBridge extends EventEmitter {
  constructor(options = {}) {
    super();

    this.name = options.name || 'SkyDrop Bridge';
    this.version = options.version || '1.0.0';

    this.connected = false;

    this.modules = {
      token: options.token || null,
      wallet: options.wallet || null,
      exchange: options.exchange || null,
      mining: options.mining || null,
      analytics: options.analytics || null
    };

    this.stats = {
      requests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      eventsForwarded: 0
    };
  }

  connect() {
    this.connected = true;

    this.emit('connected', {
      name: this.name,
      version: this.version,
      timestamp: new Date().toISOString()
    });

    return this.getStatus();
  }

  disconnect() {
    this.connected = false;

    this.emit('disconnected', {
      timestamp: new Date().toISOString()
    });

    return this.getStatus();
  }

  registerModule(name, module) {
    const allowedModules = Object.keys(this.modules);

    if (!allowedModules.includes(name)) {
      throw new Error(
        `Unsupported SkyDrop module "${name}".`
      );
    }

    this.modules[name] = module;

    this.emit('module:registered', {
      module: name,
      timestamp: new Date().toISOString()
    });

    return true;
  }

  getModule(name) {
    return this.modules[name] || null;
  }

  requireModule(name) {
    const module = this.getModule(name);

    if (!module) {
      throw new Error(
        `SkyDrop module "${name}" is not available.`
      );
    }

    return module;
  }

  call(moduleName, method, ...args) {
    this.stats.requests += 1;

    const module = this.requireModule(moduleName);

    if (typeof module[method] !== 'function') {
      this.stats.failedRequests += 1;

      throw new Error(
        `Method "${method}" is not available on SkyDrop ${moduleName}.`
      );
    }

    try {
      const result = module[method](...args);

      this.stats.successfulRequests += 1;

      return result;
    } catch (error) {
      this.stats.failedRequests += 1;

      this.emit('error', {
        module: moduleName,
        method,
        message: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  getWalletBalance(userId, asset = 'SKD') {
    if (!userId) {
      throw new Error('userId is required.');
    }

    const wallet = this.getModule('wallet');

    if (!wallet) {
      throw new Error('SkyDrop wallet module is not connected.');
    }

    if (typeof wallet.getBalance === 'function') {
      return wallet.getBalance(userId, asset);
    }

    if (typeof wallet.getBalances === 'function') {
      const balances = wallet.getBalances(userId);
      return balances[asset] || 0;
    }

    throw new Error(
      'Connected wallet module does not provide a balance method.'
    );
  }

  getAccount(userId) {
    if (!userId) {
      throw new Error('userId is required.');
    }

    const account = this.getModule('wallet');

    if (!account) {
      throw new Error('SkyDrop account/wallet module is not connected.');
    }

    if (typeof account.getAccount === 'function') {
      return account.getAccount(userId);
    }

    if (typeof account.get === 'function') {
      return account.get(userId);
    }

    throw new Error(
      'Connected wallet module does not provide an account lookup method.'
    );
  }

  getMiningStatus(userId) {
    if (!userId) {
      throw new Error('userId is required.');
    }

    const mining = this.getModule('mining');

    if (!mining) {
      throw new Error('SkyDrop mining module is not connected.');
    }

    if (typeof mining.getStatus === 'function') {
      return mining.getStatus(userId);
    }

    if (typeof mining.getMiningStatus === 'function') {
      return mining.getMiningStatus(userId);
    }

    throw new Error(
      'Connected mining module does not provide a status method.'
    );
  }

  getExchangeStatus() {
    const exchange = this.getModule('exchange');

    if (!exchange) {
      throw new Error('SkyDrop exchange module is not connected.');
    }

    if (typeof exchange.getStatus === 'function') {
      return exchange.getStatus();
    }

    throw new Error(
      'Connected exchange module does not provide a status method.'
    );
  }

  getSKDToUSDTQuote(amount) {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new Error('A valid SKD amount is required.');
    }

    const exchange = this.getModule('exchange');

    if (!exchange) {
      throw new Error('SkyDrop exchange module is not connected.');
    }

    if (typeof exchange.quote === 'function') {
      return exchange.quote('SKD', 'USDT', amount);
    }

    if (typeof exchange.getQuote === 'function') {
      return exchange.getQuote('SKD', 'USDT', amount);
    }

    throw new Error(
      'Connected exchange module does not provide a quote method.'
    );
  }

  forwardEvent(event) {
    if (!event || typeof event !== 'object') {
      throw new TypeError('A valid event object is required.');
    }

    this.stats.eventsForwarded += 1;

    const normalizedEvent = {
      source: 'skydrop',
      type: event.type || 'unknown',
      payload: event.payload || {},
      metadata: event.metadata || {},
      timestamp: event.timestamp || new Date().toISOString()
    };

    this.emit('skydrop:event', normalizedEvent);

    return normalizedEvent;
  }

  getStatus() {
    return {
      name: this.name,
      version: this.version,
      connected: this.connected,
      modules: Object.keys(this.modules).reduce((result, key) => {
        result[key] = Boolean(this.modules[key]);
        return result;
      }, {}),
      stats: {
        ...this.stats
      }
    };
  }
}

module.exports = SkyDropBridge;
