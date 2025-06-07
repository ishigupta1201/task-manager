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
} from '../actions/types'; // Import action types

const initialState = {
  token: localStorage.getItem('token'), // Get token from local storage
  isAuthenticated: null, // True if user is logged in, false otherwise
  loading: false, // Indicates if an async auth operation is in progress
  user: null, // Stores user data (email, role, _id)
  error: null, // Stores any authentication errors
  registrationSuccess: false, // To indicate if registration was successful
};

/**
 * Auth Reducer
 * Manages the authentication state of the application.
 */
export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case LOADING_AUTH_START:
      return {
        ...state,
        loading: true,
        error: null, // Clear previous errors when a new auth action starts
        registrationSuccess: false, // Reset registration success on new attempts
      };
    case LOADING_AUTH_END:
      return {
        ...state,
        loading: false,
      };
    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload, // Payload contains user data
        error: null,
      };
    case REGISTER_SUCCESS:
      // localStorage.setItem('token', action.payload.token); // Might not store token immediately for register
      return {
        ...state,
        // ...action.payload, // If register immediately logs in, spread payload
        isAuthenticated: false, // User registered but not necessarily logged in until verified
        loading: false,
        error: null,
        registrationSuccess: true, // Indicate success for UI feedback
      };
    case LOGIN_SUCCESS:
      localStorage.setItem('token', action.payload.token); // Store token on successful login
      return {
        ...state,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        user: action.payload.user, // User data from login response
        error: null,
        registrationSuccess: false,
      };
    case REGISTER_FAIL:
    case AUTH_ERROR: // Generic auth error (e.g., token invalid)
    case LOGIN_FAIL:
      localStorage.removeItem('token'); // Remove token on failed login/auth error
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.payload, // Payload contains the error message
        registrationSuccess: false,
      };
    case LOGOUT:
      localStorage.removeItem('token'); // Remove token on logout
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: null,
        registrationSuccess: false,
      };
    case CLEAR_AUTH_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}