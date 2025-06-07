import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../redux/actions/authActions'; // Action to dispatch for registration
import Button from '../Common/Button'; // Reusable Button component

/**
 * RegisterForm Component.
 * Handles user registration with email, password, and role selection.
 */
const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user', // Default role
  });

  const [errors, setErrors] = useState({}); // State for client-side validation errors
  const dispatch = useDispatch();
  const { loading, error, registrationSuccess } = useSelector((state) => state.auth); // Get state from Redux

  const { email, password, confirmPassword, role } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for the field as user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Dispatch register action
      dispatch(registerUser({ email, password, role }));
    }
  };

  return (
    <div style={formContainerStyle}>
      <h2 style={headingStyle}>Register</h2>
      {registrationSuccess && (
        <p style={successTextStyle}>Registration successful! You can now log in.</p>
      )}
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={formGroupStyle}>
          <label htmlFor="email" style={labelStyle}>Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter your email"
          />
          {errors.email && <p style={errorTextStyle}>{errors.email}</p>}
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="password" style={labelStyle}>Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter your password"
          />
          {errors.password && <p style={errorTextStyle}>{errors.password}</p>}
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && <p style={errorTextStyle}>{errors.confirmPassword}</p>}
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="role" style={labelStyle}>Role:</label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          {/* Note: In a real app, role selection for non-admin users registering themselves
               would typically be restricted or hidden, only 'admin' would be allowed to set roles.
               This is included for assignment completeness but consider security implications. */}
        </div>
        {error && <p style={apiErrorTextStyle}>Error: {error}</p>} {/* Display backend error */}
        <Button
          type="submit"
          disabled={loading} // Disable button when loading
          variant="primary"
          style={buttonStyle}
        >
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </form>
    </div>
  );
};

// --- Basic Inline Styles (Replace with your preferred CSS solution) ---
const formContainerStyle = {
  backgroundColor: '#f9f9f9',
  padding: '30px',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  width: '100%',
  maxWidth: '400px',
  margin: '50px auto',
};

const headingStyle = {
  textAlign: 'center',
  color: '#333',
  marginBottom: '25px',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const formGroupStyle = {
  marginBottom: '18px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: 'bold',
  color: '#555',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid #ddd',
  borderRadius: '5px',
  fontSize: '16px',
  boxSizing: 'border-box',
};

const errorTextStyle = {
  color: '#dc3545',
  fontSize: '14px',
  marginTop: '5px',
};

const apiErrorTextStyle = {
  color: '#dc3545',
  fontSize: '15px',
  textAlign: 'center',
  marginTop: '15px',
  fontWeight: 'bold',
};

const successTextStyle = {
    color: '#28a745',
    fontSize: '16px',
    textAlign: 'center',
    marginBottom: '15px',
    fontWeight: 'bold',
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  fontSize: '18px',
  marginTop: '20px',
};

export default RegisterForm;