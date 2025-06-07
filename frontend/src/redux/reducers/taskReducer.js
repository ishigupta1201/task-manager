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
} from '../actions/types'; // Import action types

const initialState = {
  tasks: [], // Array to store all fetched tasks
  selectedTask: null, // Stores a single task when viewed or edited
  loading: false, // Indicates if an async task operation is in progress
  error: null, // Stores any task-related errors
};

/**
 * Task Reducer
 * Manages the state related to task operations (CRUD, fetching).
 */
export default function taskReducer(state = initialState, action) {
  switch (action.type) {
    case TASK_LOADING_START:
      return {
        ...state,
        loading: true,
        error: null, // Clear previous errors when a new task action starts
      };
    case TASK_LOADING_END:
      return {
        ...state,
        loading: false,
      };
    case GET_TASKS:
      return {
        ...state,
        tasks: action.payload,
        loading: false,
        error: null,
      };
    case GET_TASK_BY_ID:
      return {
        ...state,
        selectedTask: action.payload,
        loading: false,
        error: null,
      };
    case ADD_TASK:
      return {
        ...state,
        tasks: [action.payload, ...state.tasks], // Add new task to the beginning of the list
        loading: false,
        error: null,
      };
    case UPDATE_TASK:
      return {
        ...state,
        // Map over existing tasks and replace the updated one
        tasks: state.tasks.map((task) =>
          task._id === action.payload._id ? action.payload : task
        ),
        selectedTask: state.selectedTask && state.selectedTask._id === action.payload._id
          ? action.payload // Update selectedTask if it's the one being updated
          : state.selectedTask,
        loading: false,
        error: null,
      };
    case DELETE_TASK:
      return {
        ...state,
        // Filter out the deleted task
        tasks: state.tasks.filter((task) => task._id !== action.payload),
        loading: false,
        error: null,
      };
    case TASK_ERROR:
      return {
        ...state,
        error: action.payload, // Payload is the error message
        loading: false,
      };
    case CLEAR_TASK_ERROR:
      return {
        ...state,
        error: null,
      };
    case CLEAR_TASK_STATE:
        return {
            ...initialState, // Reset to initial state, excluding token and isAuthenticated from auth
            tasks: [],
            selectedTask: null,
            loading: false,
            error: null,
        }
    default:
      return state;
  }
}