import api from '../../services/api'; // Axios instance for API calls
import {
  GET_USERS,
  UPDATE_USER,
  DELETE_USER,
  USER_ERROR,
  CLEAR_USER_ERROR,
  USER_LOADING_START,
  USER_LOADING_END,
} from './types'; // Action types

// Fetch All Users (for Admin Panel and Task Assignment dropdowns)
export const fetchUsers = () => async (dispatch) => {
  dispatch({ type: USER_LOADING_START });
  try {
    const res = await api.get('/users'); // API endpoint to get all users
    dispatch({
      type: GET_USERS,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: USER_ERROR,
      payload: err.response?.data?.message || 'Failed to fetch users.',
    });
  } finally {
    dispatch({ type: USER_LOADING_END });
  }
};

// Update User (Admin only)
export const updateUser = (userId, userData) => async (dispatch) => {
  dispatch({ type: USER_LOADING_START });
  try {
    const res = await api.put(`/users/${userId}`, userData); // API endpoint to update a user
    dispatch({
      type: UPDATE_USER,
      payload: res.data, // Returns the updated user object
    });
    alert('User updated successfully!'); // Simple success feedback
  } catch (err) {
    dispatch({
      type: USER_ERROR,
      payload: err.response?.data?.message || 'Failed to update user.',
    });
  } finally {
    dispatch({ type: USER_LOADING_END });
  }
};

// Delete User (Admin only)
export const deleteUser = (userId) => async (dispatch) => {
  dispatch({ type: USER_LOADING_START });
  try {
    await api.delete(`/users/${userId}`); // API endpoint to delete a user
    dispatch({
      type: DELETE_USER,
      payload: userId, // Pass the ID of the deleted user to the reducer
    });
    alert('User deleted successfully!'); // Simple success feedback
  } catch (err) {
    dispatch({
      type: USER_ERROR,
      payload: err.response?.data?.message || 'Failed to delete user.',
    });
  } finally {
    dispatch({ type: USER_LOADING_END });
  }
};

// Clear User Error
export const clearUserError = () => (dispatch) => {
  dispatch({ type: CLEAR_USER_ERROR });
};