export class Timeline {
  constructor(options = {}) {
    this.options = {
      maxHistory: options.maxHistory ?? 500,
      ...options
    };

    this.entries = [];
  }

  add(entry = {}) {
    const normalized = {
      id: entry.id ?? this.generateId(),
      type: entry.type ?? "unknown",
      timestamp: entry.timestamp ?? Date.now(),
      data: entry.data ?? null
    };

    this.entries.push(normalized);

    this.trim(this.options.maxHistory);

    return structuredClone(normalized);
  }

  get(options = {}) {
    let result = [...this.entries];

    if (options.type) {
      result = result.filter(
        item => item.type === options.type
      );
    }

    if (options.from) {
      result = result.filter(
        item => item.timestamp >= options.from
      );
    }

    if (options.to) {
      result = result.filter(
        item => item.timestamp <= options.to
      );
    }

    if (options.limit) {
      result = result.slice(-options.limit);
    }

    return result.map(item =>
      structuredClone(item)
    );
  }

  latest() {
    const item =
      this.entries[this.entries.length - 1];

    return item
      ? structuredClone(item)
      : null;
  }

  trim(maxHistory = this.options.maxHistory) {
    if (this.entries.length <= maxHistory) {
      return;
    }

    this.entries.splice(
      0,
      this.entries.length - maxHistory
    );
  }

  clear() {
    this.entries = [];
  }

  generateId() {
    return `timeline_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
}

export default Timeline;
