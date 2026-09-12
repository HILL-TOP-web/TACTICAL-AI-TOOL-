/**
 * Intent Classifier
 * -----------------
 * Lightweight rule-based classifier for the Tactical AI.
 *
 * This is intentionally local and does not require an external
 * AI API. It can later be replaced by a trained ML model.
 */

class IntentClassifier {
  constructor() {
    this.intents = {
      greeting: [
        "hello",
        "hi",
        "hey",
        "good morning",
        "good afternoon",
        "good evening"
      ],

      status: [
        "status",
        "situation report",
        "sitrep",
        "current situation",
        "report status"
      ],

      briefing: [
        "brief me",
        "briefing",
        "give me a briefing",
        "summarize the situation"
      ],

      terrain: [
        "terrain",
        "ground",
        "elevation",
        "land cover",
        "obstacle",
        "map terrain"
      ],

      weather: [
        "weather",
        "rain",
        "wind",
        "temperature",
        "forecast",
        "visibility"
      ],

      logistics: [
        "logistics",
        "supplies",
        "resources",
        "fuel",
        "food",
        "equipment"
      ],

      routing: [
        "route",
        "routing",
        "path",
        "navigation",
        "waypoint",
        "travel"
      ],

      simulation: [
        "simulation",
        "simulate",
        "scenario",
        "exercise",
        "training scenario"
      ],

      knowledge: [
        "what is",
        "explain",
        "define",
        "information",
        "knowledge"
      ],

      debrief: [
        "debrief",
        "after action",
        "after-action",
        "lessons learned",
        "review exercise"
      ]
    };
  }

  normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  classify(text) {
    const normalized = this.normalize(text);

    if (!normalized) {
      return {
        intent: "unknown",
        confidence: 0
      };
    }

    let bestIntent = "unknown";
    let bestScore = 0;

    for (const [intent, keywords] of Object.entries(this.intents)) {
      let score = 0;

      for (const keyword of keywords) {
        if (normalized.includes(keyword)) {
          score += keyword.split(" ").length;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }

    const confidence = Math.min(
      1,
      bestScore / 3
    );

    return {
      intent: bestIntent,
      confidence: Number(confidence.toFixed(2)),
      input: text
    };
  }
}

module.exports = IntentClassifier;
