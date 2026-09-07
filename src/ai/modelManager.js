// ai/modelManager.js

class ModelManager {
  constructor(options = {}) {
    this.models = new Map();
    this.defaultModel = options.defaultModel || null;
  }

  register(name, model, metadata = {}) {
    if (!name) {
      throw new Error("Model name is required");
    }

    if (!model) {
      throw new Error(`Model is required for "${name}"`);
    }

    this.models.set(name, {
      name,
      model,
      metadata,
      registeredAt: new Date().toISOString()
    });

    if (!this.defaultModel) {
      this.defaultModel = name;
    }

    return this.get(name);
  }

  unregister(name) {
    const removed = this.models.delete(name);

    if (name === this.defaultModel) {
      this.defaultModel =
        this.models.keys().next().value || null;
    }

    return removed;
  }

  has(name) {
    return this.models.has(name);
  }

  get(name = null) {
    const modelName =
      name || this.defaultModel;

    if (!modelName) {
      throw new Error("No model has been selected");
    }

    const entry = this.models.get(modelName);

    if (!entry) {
      throw new Error(
        `Model "${modelName}" is not registered`
      );
    }

    return entry;
  }

  getModel(name = null) {
    return this.get(name).model;
  }

  setDefault(name) {
    if (!this.models.has(name)) {
      throw new Error(
        `Cannot set unknown model "${name}" as default`
      );
    }

    this.defaultModel = name;
    return this.defaultModel;
  }

  list() {
    return Array.from(this.models.values()).map(entry => ({
      name: entry.name,
      metadata: entry.metadata,
      registeredAt: entry.registeredAt
    }));
  }

  async healthCheck(name = null) {
    const entry = this.get(name);
    const model = entry.model;

    if (typeof model.healthCheck === "function") {
      return {
        name: entry.name,
        healthy: await model.healthCheck()
      };
    }

    return {
      name: entry.name,
      healthy: true
    };
  }

  async generate(prompt, options = {}) {
    const model = this.getModel(options.model);

    if (typeof model.generate !== "function") {
      throw new Error(
        "Selected model does not implement generate()"
      );
    }

    return model.generate(prompt, options);
  }

  async embed(text, options = {}) {
    const model = this.getModel(options.model);

    if (typeof model.embed !== "function") {
      throw new Error(
        "Selected model does not implement embed()"
      );
    }

    return model.embed(text, options);
  }
}

module.exports = ModelManager;
