import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector, Provider } from 'react-redux';
import store from './redux/store'; // Your Redux store
import { loadUser } from './redux/actions/authActions'; // Action to load user on app start

// Import your page components
import LoginPage from './pages/Auth/LoginPage.js';
import RegisterPage from './pages/Auth/RegisterPage.js';
import DashboardPage from './pages/Auth/DashboardPage.js';
import TaskDetailPage from './pages/Auth/TaskDetailPage.js';
import AdminPanelPage from './pages/Auth/AdminPanelPage.js';

import './index.css'; // Your global styles (if you have them)

/**
 * PrivateRoute Component
 * Protects routes that require authentication.
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    // Optionally render a loading spinner or placeholder
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading application...</div>;
  }

  // If not authenticated, redirect to login page
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/**
 * AdminRoute Component
 * Protects routes that require 'admin' role.
 * This implicitly relies on PrivateRoute protecting it first, as only authenticated users will reach this check.
 */
const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useSelector((state) => state.auth);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading user permissions...</div>;
  }

  // If not authenticated, redirect to login (should be caught by PrivateRoute first)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but not an admin, redirect to dashboard or access denied page
  if (user && user.role !== 'admin') {
    alert('Access Denied: You do not have administrative privileges.');
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and is admin, render children
  return children;
};


/**
 * App Component.
 * The root component of the React application.
 * Sets up Redux Provider, React Router, and initial user loading.
 */
const App = () => {
  const dispatch = useDispatch();

  // Load user on application start
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes (require authentication) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks/:id"
          element={
            <PrivateRoute>
              <TaskDetailPage />
            </PrivateRoute>
          }
        />

        {/* Admin Protected Routes (require 'admin' role) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanelPage />
            </AdminRoute>
          }
        />

        {/* Default redirect to Dashboard if authenticated, else to Login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Catch all for 404 (optional) */}
        <Route path="*" element={<h1 style={{textAlign: 'center', marginTop: '100px'}}>404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
};

// Wrap the App component with Redux Provider
const AppWithRedux = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

export default AppWithRedux;