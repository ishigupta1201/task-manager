import api from '../services/api'; // Import your pre-configured Axios instance

/**
 * Sets or removes the authentication token in Axios default headers.
 * This function should be called whenever the token changes (e.g., on login, logout, app load).
 *
 * @param {string | null} token - The JWT token to set, or null to remove it.
 */
const setAuthToken = (token) => {
  if (token) {
    // Apply for every request
    api.defaults.headers.common['x-auth-token'] = token;
    // Store in localStorage for persistence across sessions
    localStorage.setItem('token', token);
  } else {
    // Delete auth header
    delete api.defaults.headers.common['x-auth-token'];
    // Remove from localStorage
    localStorage.removeItem('token');
  }
};

/**
 * Gets the authentication token from localStorage.
 * Useful for initial setup or direct checks if Redux state isn't immediately available.
 *
 * @returns {string | null} The JWT token or null if not found.
 */
const getAuthToken = () => {
  return localStorage.getItem('token');
};

export { setAuthToken, getAuthToken };