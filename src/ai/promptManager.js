// ai/promptManager.js

class PromptManager {
  constructor(options = {}) {
    this.templates = new Map();

    if (options.templates) {
      this.registerMany(
        options.templates
      );
    }
  }

  register(name, template, metadata = {}) {
    if (!name) {
      throw new Error(
        "Prompt name is required"
      );
    }

    if (
      typeof template !== "string"
    ) {
      throw new Error(
        "Prompt template must be a string"
      );
    }

    this.templates.set(name, {
      name,
      template,
      metadata,
      createdAt:
        new Date().toISOString()
    });

    return this.get(name);
  }

  registerMany(templates) {
    for (const [name, value] of Object.entries(
      templates
    )) {
      if (
        typeof value === "string"
      ) {
        this.register(
          name,
          value
        );
      } else {
        this.register(
          name,
          value.template,
          value.metadata
        );
      }
    }
  }

  has(name) {
    return this.templates.has(name);
  }

  get(name) {
    const prompt =
      this.templates.get(name);

    if (!prompt) {
      throw new Error(
        `Prompt "${name}" not found`
      );
    }

    return prompt;
  }

  render(name, variables = {}) {
    const prompt =
      this.get(name);

    return this.interpolate(
      prompt.template,
      variables
    );
  }

  interpolate(template, variables) {
    return template.replace(
      /\{\{\s*([\w.-]+)\s*\}\}/g,
      (match, key) => {
        const value =
          this.resolve(
            variables,
            key
          );

        return value === undefined ||
          value === null
          ? ""
          : String(value);
      }
    );
  }

  resolve(object, path) {
    return path
      .split(".")
      .reduce(
        (current, key) =>
          current == null
            ? undefined
            : current[key],
        object
      );
  }

  list() {
    return Array.from(
      this.templates.values()
    ).map(prompt => ({
      name: prompt.name,
      metadata: prompt.metadata,
      createdAt: prompt.createdAt
    }));
  }

  remove(name) {
    return this.templates.delete(name);
  }

  clear() {
    this.templates.clear();
  }
}

module.exports = PromptManager;
