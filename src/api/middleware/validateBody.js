module.exports = (requiredFields = []) => {
  return (req, res, next) => {
    const missing = requiredFields.filter((field) => {
      const value = req.body?.[field];

      return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      );
    });

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        missingFields: missing,
      });
    }

    next();
  };
};
