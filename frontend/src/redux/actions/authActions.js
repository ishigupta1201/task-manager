import api from '../../services/api'; // Axios instance for API calls
import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  LOADING_AUTH_START,
  LOADING_AUTH_END,
  CLEAR_AUTH_ERROR,
} from './types'; // Action types

// Load User - Checks token and loads user data
export const loadUser = () => async (dispatch) => {
  if (localStorage.token) {
    // Set token in Axios headers for all requests if available
    api.defaults.headers.common['x-auth-token'] = localStorage.token;
  } else {
    delete api.defaults.headers.common['x-auth-token'];
  }

  try {
    dispatch({ type: LOADING_AUTH_START });
    const res = await api.get('/auth'); // Endpoint to verify token and get user
    dispatch({
      type: USER_LOADED,
      payload: res.data, // Contains user object { _id, email, role }
    });
  } catch (err) {
    dispatch({
      type: AUTH_ERROR,
      payload: err.response?.data?.message || 'Authentication failed. Please log in.',
    });
    // Ensure token is removed if it was invalid
    localStorage.removeItem('token');
  } finally {
    dispatch({ type: LOADING_AUTH_END });
  }
};

// Register User
export const registerUser = ({ email, password, role }) => async (dispatch) => {
  dispatch({ type: LOADING_AUTH_START });
  try {
    const res = await api.post('/auth/register', { email, password, role });
    dispatch({
      type: REGISTER_SUCCESS,
      payload: res.data, // Usually contains a success message
    });
  } catch (err) {
    dispatch({
      type: REGISTER_FAIL,
      payload: err.response?.data?.message || 'Registration failed. Please try again.',
    });
  } finally {
    dispatch({ type: LOADING_AUTH_END });
  }
};

// Login User
export const loginUser = ({ email, password }) => async (dispatch) => {
  dispatch({ type: LOADING_AUTH_START });
  try {
    const res = await api.post('/auth/login', { email, password });
    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data, // Contains { token, user: { _id, email, role } }
    });
    // Immediately load user after successful login to update state with user data
    dispatch(loadUser());
  } catch (err) {
    dispatch({
      type: LOGIN_FAIL,
      payload: err.response?.data?.message || 'Login failed. Please check your credentials.',
    });
  } finally {
    dispatch({ type: LOADING_AUTH_END });
  }
};

// Logout User
export const logoutUser = () => (dispatch) => {
  dispatch({ type: LOGOUT });
  // Clear Axios header
  delete api.defaults.headers.common['x-auth-token'];
};

// Clear Auth Error
export const clearAuthError = () => (dispatch) => {
  dispatch({ type: CLEAR_AUTH_ERROR });
};