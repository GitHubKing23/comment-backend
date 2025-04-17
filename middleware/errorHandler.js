// errorHandler.js

module.exports = (err, req, res, next) => {
    // Log the error details to the console for debugging purposes
    console.error("❌ Error:", err.message);
  
    // Set the response status code based on the error status, or default to 500 if not specified
    const statusCode = err.status || 500;
  
    // Send a JSON response with the error message
    res.status(statusCode).json({
      message: err.message || "Internal Server Error", // Default to a generic message if none is provided
      // You can include stack trace information only in development for security reasons
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
  };
  