/**
 * Briefing Summarizer
 * -------------------
 * Converts simulation information into a concise training
 * briefing.
 */

class BriefingSummarizer {
  summarize(data = {}) {
    const {
      scenario = "Unknown scenario",
      environment = "Unknown",
      personnel = 0,
      resources = 0,
      weather = "Unknown",
      terrain = "Unknown",
      status = "Unknown"
    } = data;

    return [
      `Scenario: ${scenario}.`,
      `Environment: ${environment}.`,
      `Personnel: ${personnel}.`,
      `Resources: ${resources}.`,
      `Weather: ${weather}.`,
      `Terrain: ${terrain}.`,
      `Overall status: ${status}.`
    ].join(" ");
  }
}

module.exports = BriefingSummarizer;
