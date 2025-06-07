import api from '../../services/api'; // Axios instance for API calls
import {
  GET_TASKS,
  GET_TASK_BY_ID,
  ADD_TASK,
  UPDATE_TASK,
  DELETE_TASK,
  TASK_ERROR,
  CLEAR_TASK_ERROR,
  TASK_LOADING_START,
  TASK_LOADING_END,
  CLEAR_TASK_STATE,
} from './types'; // Action types

/**
 * Helper function to build query string for filters and sorting.
 * @param {object} params - An object containing filter and sort parameters.
 * @returns {string} - A URL query string.
 */
const buildQueryParams = (params) => {
  const query = new URLSearchParams();
  for (const key in params) {
    if (params[key]) { // Only add if the value is not empty
      query.append(key, params[key]);
    }
  }
  return query.toString();
};

// Fetch All Tasks (with optional filters and sorting)
export const fetchTasks = (filters = {}) => async (dispatch) => {
  dispatch({ type: TASK_LOADING_START });
  try {
    const queryString = buildQueryParams(filters);
    const res = await api.get(`/tasks?${queryString}`); // API endpoint to get tasks
    dispatch({
      type: GET_TASKS,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: TASK_ERROR,
      payload: err.response?.data?.message || 'Failed to fetch tasks.',
    });
  } finally {
    dispatch({ type: TASK_LOADING_END });
  }
};

// Fetch Task by ID
export const fetchTaskById = (id) => async (dispatch) => {
  dispatch({ type: TASK_LOADING_START });
  try {
    const res = await api.get(`/tasks/${id}`); // API endpoint to get a single task
    dispatch({
      type: GET_TASK_BY_ID,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: TASK_ERROR,
      payload: err.response?.data?.message || 'Failed to fetch task details.',
    });
  } finally {
    dispatch({ type: TASK_LOADING_END });
  }
};

// Add New Task
// formData should be a FormData object if files are attached
export const createTask = (formData) => async (dispatch) => {
  dispatch({ type: TASK_LOADING_START });
  try {
    // Axios automatically sets Content-Type to multipart/form-data when FormData is used
    const res = await api.post('/tasks', formData);
    dispatch({
      type: ADD_TASK,
      payload: res.data,
    });
    alert('Task created successfully!'); // Simple success feedback
  } catch (err) {
    dispatch({
      type: TASK_ERROR,
      payload: err.response?.data?.message || 'Failed to create task.',
    });
  } finally {
    dispatch({ type: TASK_LOADING_END });
  }
};

// Update Existing Task
// formData should be a FormData object if files are attached or updated
export const updateTask = (id, formData) => async (dispatch) => {
  dispatch({ type: TASK_LOADING_START });
  try {
    const res = await api.put(`/tasks/${id}`, formData);
    dispatch({
      type: UPDATE_TASK,
      payload: res.data,
    });
    alert('Task updated successfully!'); // Simple success feedback
  } catch (err) {
    dispatch({
      type: TASK_ERROR,
      payload: err.response?.data?.message || 'Failed to update task.',
    });
  } finally {
    dispatch({ type: TASK_LOADING_END });
  }
};

// Delete Task
export const deleteTask = (id) => async (dispatch) => {
  dispatch({ type: TASK_LOADING_START });
  try {
    await api.delete(`/tasks/${id}`);
    dispatch({
      type: DELETE_TASK,
      payload: id, // Pass the ID of the deleted task
    });
    alert('Task deleted successfully!'); // Simple success feedback
  } catch (err) {
    dispatch({
      type: TASK_ERROR,
      payload: err.response?.data?.message || 'Failed to delete task.',
    });
  } finally {
    dispatch({ type: TASK_LOADING_END });
  }
};

// Clear Task Error
export const clearTaskError = () => (dispatch) => {
  dispatch({ type: CLEAR_TASK_ERROR });
};

// Clear Task State (useful when navigating away from task-related pages)
export const clearTaskState = () => (dispatch) => {
    dispatch({ type: CLEAR_TASK_STATE });
};