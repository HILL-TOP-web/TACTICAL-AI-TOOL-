function cleanText(text) {
  return String(text || "").trim();
}

exports.analyze = async (req, res, next) => {
  try {
    const text = cleanText(req.body.text);

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "text is required",
      });
    }

    const words = text.split(/\s+/).filter(Boolean);

    res.status(200).json({
      success: true,
      data: {
        inputLength: text.length,
        wordCount: words.length,
        characterCount: text.length,
        analysis: {
          type: "general",
          confidence: 0.5,
          note: "This is a local analysis layer. Connect a real model through the AI service for model-based inference.",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.summarize = async (req, res, next) => {
  try {
    const text = cleanText(req.body.text);

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "text is required",
      });
    }

    const sentences = text
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    const summary = sentences.slice(0, 2).join(". ");

    res.status(200).json({
      success: true,
      data: {
        summary: summary || text,
        sentenceCount: sentences.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.classify = async (req, res, next) => {
  try {
    const text = cleanText(req.body.text);

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "text is required",
      });
    }

    const lower = text.toLowerCase();

    let category = "general";

    if (
      lower.includes("weather") ||
      lower.includes("rain") ||
      lower.includes("wind")
    ) {
      category = "weather";
    } else if (
      lower.includes("training") ||
      lower.includes("exercise")
    ) {
      category = "training";
    } else if (
      lower.includes("situation") ||
      lower.includes("event")
    ) {
      category = "situation";
    }

    res.status(200).json({
      success: true,
      data: {
        category,
        confidence: 0.5,
      },
    });
  } catch (error) {
    next(error);
  }
};
