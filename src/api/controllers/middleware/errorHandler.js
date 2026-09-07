module.exports = (error, req, res, next) => {
  console.error("API Error:", error);

  const statusCode = error.statusCode || error.status || 500;

  res.status(statusCode).json({
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message || "Internal server error",
  });
};
