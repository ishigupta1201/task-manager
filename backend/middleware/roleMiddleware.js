/**
 * Middleware to restrict access based on user roles.
 *
 * @param {Array<string>} roles - An array of allowed roles (e.g., ['admin', 'user']).
 * @returns {function} - An Express middleware function.
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    // req.user is populated by the authMiddleware
    if (!req.user || !req.user.role) {
      // This case ideally shouldn't happen if authMiddleware runs before this,
      // but it's a safeguard.
      return res.status(401).json({ message: 'Authentication required. User role not found.' });
    }

    // Check if the user's role is included in the allowed roles for this route
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. You do not have the necessary permissions.' });
    }

    // If authorized, proceed to the next middleware or route handler
    next();
  };
};

module.exports = authorizeRoles;