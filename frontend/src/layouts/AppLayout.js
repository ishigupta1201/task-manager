import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser } from '../redux/actions/authActions'; // Action to dispatch for logout
import Button from '../components/Common/Button'; // Reusable Button component

/**
 * AppLayout Component.
 * Provides the main layout for authenticated users, including header, navigation, and footer.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The content of the specific page to be displayed within the layout.
 */
const AppLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth); // Get current logged-in user from Redux state

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login'); // Redirect to login page after logout
  };

  // Basic inline styles for a simple layout.
  // Replace with a CSS module, TailwindCSS, or a styled-components approach for production.
  const layoutStyle = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f4f7f6', // Light background for app content
  };

  const headerStyle = {
    backgroundColor: '#007bff', // Primary blue
    color: 'white',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  const navStyle = {
    display: 'flex',
    gap: '20px',
  };

  const navLinkStyle = {
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'color 0.3s ease',
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  };

  const mainContentStyle = {
    flex: 1, // Takes up remaining vertical space
    padding: '30px',
  };

  const footerStyle = {
    backgroundColor: '#333',
    color: 'white',
    textAlign: 'center',
    padding: '15px',
    marginTop: 'auto', // Pushes footer to the bottom
    fontSize: '14px',
  };

  return (
    <div style={layoutStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>
            <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
              Task Manager
            </Link>
          </h1>
          <nav style={navStyle}>
            <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
            {user?.role === 'admin' && ( // Only show Admin Panel link if user is admin
              <Link to="/admin" style={navLinkStyle}>Admin Panel</Link>
            )}
            {/* Add more navigation links here as needed */}
          </nav>
        </div>

        <div style={userInfoStyle}>
          {user && (
            <span>Welcome, **{user.email}** ({user.role})</span>
          )}
          <Button onClick={handleLogout} variant="secondary" style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}>
            Logout
          </Button>
        </div>
      </header>

      <main style={mainContentStyle}>
        {children} {/* Renders the specific page content */}
      </main>

      <footer style={footerStyle}>
        &copy; {new Date().getFullYear()} Task Manager. All rights reserved.
      </footer>
    </div>
  );
};

export default AppLayout;