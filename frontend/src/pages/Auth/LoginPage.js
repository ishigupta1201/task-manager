import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout'; // Layout for authentication pages
import LoginForm from '../../components/Auth/LoginForm'; // The login form component

/**
 * LoginPage Component.
 * This is the main page for user login.
 * It uses the AuthLayout and renders the LoginForm.
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((state) => state.auth); // Get auth state from Redux

  // Effect to redirect if the user is already authenticated
  useEffect(() => {
    // If not loading and already authenticated, redirect to the dashboard
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <AuthLayout>
      {/* LoginForm component handles the actual form inputs and submission logic */}
      <LoginForm />
      <p style={registerLinkStyle}>
        Don't have an account? <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>Register here</Link>
      </p>
    </AuthLayout>
  );
};

// --- Basic Inline Styles (Replace with your preferred CSS solution) ---
const registerLinkStyle = {
  textAlign: 'center',
  marginTop: '20px',
  fontSize: '15px',
  color: '#555',
};

export default LoginPage;