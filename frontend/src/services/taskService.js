import api from './api'; // Import the pre-configured Axios instance

/**
 * Authentication Service
 * Centralizes API calls related to user authentication.
 */
const authService = {
  /**
   * Registers a new user.
   * @param {object} userData - User data (email, password, role).
   * @returns {Promise<object>} - Response data from the API.
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Logs in an existing user.
   * @param {object} credentials - User credentials (email, password).
   * @returns {Promise<object>} - Response data from the API (includes token and user info).
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Loads the authenticated user's data based on the token.
   * @returns {Promise<object>} - User data from the API.
   */
  loadUser: async () => {
    const response = await api.get('/auth');
    return response.data;
  },
};

export default authService;