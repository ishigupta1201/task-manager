import React from 'react';

/**
 * AuthLayout Component.
 * Provides a common layout for authentication pages (Login, Register).
 * It typically centers the content and might include a logo or a simple message.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The content (Login or Register form) to be displayed within the layout.
 */
const AuthLayout = ({ children }) => {
  // Basic inline styles for a simple centered layout.
  // In a real project, you'd use a CSS module, TailwindCSS, or a styled-components approach.
  const layoutStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5', // Light grey background
    padding: '20px',
  };

  const headerStyle = {
    marginBottom: '30px',
    textAlign: 'center',
    color: '#333',
  };

  const contentWrapperStyle = {
    width: '100%',
    maxWidth: '450px',
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  };

  const footerStyle = {
    marginTop: '30px',
    color: '#666',
    fontSize: '14px',
  };

  return (
    <div style={layoutStyle}>
      <header style={headerStyle}>
        <h1>Task Manager</h1>
        <p>Your personal productivity companion</p>
      </header>

      <main style={contentWrapperStyle}>
        {children} {/* This is where the LoginForm or RegisterForm will be rendered */}
      </main>

      <footer style={footerStyle}>
        &copy; {new Date().getFullYear()} Task Manager. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthLayout;