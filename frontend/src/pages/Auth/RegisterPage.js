import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout'; // Layout for authentication pages
import RegisterForm from '../../components/Auth/RegisterForm'; // The registration form component

/**
 * RegisterPage Component.
 * This is the main page for user registration.
 * It uses the AuthLayout and renders the RegisterForm.
 */
const RegisterPage = () => {
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
      {/* RegisterForm component handles the actual form inputs and submission logic */}
      <RegisterForm />
      <p style={loginLinkStyle}>
        Already have an account? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Login here</Link>
      </p>
    </AuthLayout>
  );
};

// --- Basic Inline Styles (Replace with your preferred CSS solution) ---
const loginLinkStyle = {
  textAlign: 'center',
  marginTop: '20px',
  fontSize: '15px',
  color: '#555',
};

export default RegisterPage;