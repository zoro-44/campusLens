const multer = require("multer");

module.exports = (err, req, res, next) => {
  console.error("Error handler caught error:", err);

  // Multer error handling
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File size exceeds limit. Maximum limit is 5MB."
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }

  // Custom errors or standard database errors
  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected server error occurred";

  res.status(statusCode).json({
    success: false,
    error: message,
    // Include stack trace only in development
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};
