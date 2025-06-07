import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppLayout from './AppLayout'; // Reuse the main application layout

/**
 * AdminLayout Component.
 * This layout is specifically for pages that require 'admin' role.
 * It checks the user's role and redirects if unauthorized.
 * It wraps the AppLayout to maintain consistent header/footer/overall structure.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The content of the admin-specific page.
 */
const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  // Effect to handle authorization check
  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
    // If authenticated but user data is loaded and role is not 'admin', redirect to dashboard
    else if (!loading && isAuthenticated && user && user.role !== 'admin') {
      alert('Access Denied: You do not have administrator privileges.');
      navigate('/dashboard'); // Redirect to dashboard or another appropriate page
    }
    // If loading, do nothing yet, wait for authentication status
  }, [isAuthenticated, user, loading, navigate]);

  // Render nothing or a loading indicator while authentication status is being determined
  if (loading || !isAuthenticated || (user && user.role !== 'admin')) {
    // A simple loading or redirect message can be displayed
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        {loading ? <p>Loading user data...</p> : <p>Redirecting...</p>}
      </div>
    );
  }

  // If user is authenticated and has 'admin' role, render the AppLayout with admin content
  return (
    <AppLayout>
      <div style={adminContentWrapperStyle}>
        <h2 style={adminHeadingStyle}>Admin Panel</h2>
        {children} {/* Renders the actual admin page content (e.g., UserManagementTable) */}
      </div>
    </AppLayout>
  );
};

// --- Basic Inline Styles ---
const adminContentWrapperStyle = {
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  minHeight: 'calc(100vh - 180px)', // Adjust height considering header/footer
};

const adminHeadingStyle = {
  textAlign: 'center',
  color: '#007bff',
  marginBottom: '30px',
  borderBottom: '2px solid #eee',
  paddingBottom: '15px',
};

export default AdminLayout;