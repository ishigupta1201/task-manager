// backend/middleware/errorHandler.js
/**
 * Global error handling middleware for Express.
 * Catches errors passed via next(err) or unhandled errors in async routes.
 *
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function in the stack.
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging purposes (in development, you might want more detail)
  console.error(err.stack);

  // Set a default status code and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server.';

  // Handle specific Mongoose errors
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    // For invalid ObjectId format
    statusCode = 404;
    message = 'Resource not found.';
  }

  if (err.code === 11000) {
    // For duplicate key errors (e.g., duplicate email)
    statusCode = 400;
    message = `Duplicate field value: ${Object.keys(err.keyValue)[0]} already exists.`;
  }

  if (err.name === 'ValidationError') {
    // Mongoose validation errors (e.g., required fields missing)
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Send the error response
  res.status(statusCode).json({
    success: false,
    message: message,
    // In development, you might want to send the full error stack
    // In production, keep it simple to avoid leaking sensitive info
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;