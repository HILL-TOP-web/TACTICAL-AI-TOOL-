'use strict';

class ConversationMemory {
    constructor(options = {}) {
        this.maxEntries = options.maxEntries || 50;
        this.history = [];
        this.variables = {};
    }

    add(entry) {
        if (!entry) {
            return;
        }

        this.history.push({
            ...entry,
            timestamp:
                entry.timestamp ||
                new Date().toISOString()
        });

        this.trim(this.maxEntries);
    }

    trim(limit = this.maxEntries) {
        if (this.history.length > limit) {
            this.history =
                this.history.slice(-limit);
        }
    }

    set(key, value) {
        if (!key) {
            return;
        }

        this.variables[key] = value;
    }

    get(key) {
        return this.variables[key];
    }

    getHistory() {
        return [...this.history];
    }

    getLast(count = 5) {
        return this.history.slice(-count);
    }

    getContext() {
        return {
            variables: {
                ...this.variables
            },
            recentHistory: this.getLast(10)
        };
    }

    clear() {
        this.history = [];
        this.variables = {};
    }

    size() {
        return this.history.length;
    }
}

function createMemory(options = {}) {
    return new ConversationMemory(options);
}

module.exports = {
    ConversationMemory,
    createMemory
};
