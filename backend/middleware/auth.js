const jwt = require('jsonwebtoken');
const constants = require('../config/constants'); // Import your JWT_SECRET

/**
 * Middleware to authenticate requests using JWT.
 * It expects a token in the 'x-auth-token' header.
 */
module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, constants.JWT_SECRET);

    // Attach user information from the token payload to the request object
    // The payload usually contains { user: { id: 'userId', role: 'userRole' } }
    req.user = decoded.user;
    next(); // Move to the next middleware/route handler
  } catch (err) {
    // Token is not valid (e.g., expired, malformed)
    res.status(401).json({ message: 'Token is not valid.' });
  }
};