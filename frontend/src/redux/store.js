import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import authReducer from './reducers/authReducer'; // Your authentication reducer
import taskReducer from './reducers/taskReducer'; // Your task management reducer
import userReducer from './reducers/userReducer'; // Your user management reducer (for admin panel and task assignment)

// Combine all your reducers into a single root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  tasks: taskReducer,
  users: userReducer,
  // Add more reducers here as your application grows
});

// Configure the Redux store
// configureStore automatically sets up Redux Thunk middleware
// and Redux DevTools Extension integration.
const store = configureStore({
  reducer: rootReducer,
  // Middleware can be customized here if needed, but configureStore handles defaults.
  // devTools: process.env.NODE_ENV !== 'production', // Enable DevTools only in development
});

export default store;