import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import your global styles
import AppWithRedux from './App'; // Import the App component wrapped with Redux Provider

// Get the root DOM element where your React app will be mounted
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the React application
root.render(
  <React.StrictMode>
    {/* AppWithRedux is the main component, which includes Redux Provider and React Router */}
    <AppWithRedux />
  </React.StrictMode>
);