import React from 'react';

/**
 * Reusable Button Component.
 *
 * @param {object} props - Component props.
 * @param {string} props.children - The content to be displayed inside the button (e.g., "Submit", "Cancel").
 * @param {string} [props.type='button'] - The type of the button (e.g., 'button', 'submit', 'reset').
 * @param {function} [props.onClick] - The function to call when the button is clicked.
 * @param {string} [props.className=''] - Additional CSS classes for styling.
 * @param {boolean} [props.disabled=false] - If true, the button will be disabled.
 * @param {string} [props.variant='primary'] - Defines the button's visual style ('primary', 'secondary', 'danger', etc.).
 * @param {object} [props.style={}] - Inline CSS styles.
 */
const Button = ({
  children,
  type = 'button',
  onClick,
  className = '',
  disabled = false,
  variant = 'primary', // Default variant
  style = {},
  ...rest // Any other HTML button attributes
}) => {
  // Basic styling based on variant. You would typically use a CSS framework like TailwindCSS
  // or a dedicated CSS file for more complex and consistent styling.
  const baseStyle = {
    padding: '10px 20px',
    borderRadius: '5px',
    border: '1px solid',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    transition: 'background-color 0.3s ease',
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#007bff',
      color: 'white',
      borderColor: '#007bff',
    },
    secondary: {
      backgroundColor: '#6c757d',
      color: 'white',
      borderColor: '#6c757d',
    },
    danger: {
      backgroundColor: '#dc3545',
      color: 'white',
      borderColor: '#dc3545',
    },
    success: {
      backgroundColor: '#28a745',
      color: 'white',
      borderColor: '#28a745',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#007bff',
      borderColor: '#007bff',
    },
    // Add more variants as needed
  };

  const combinedStyle = {
    ...baseStyle,
    ...variantStyles[variant],
    ...style, // Allow overriding with inline style prop
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`button ${variant} ${className}`} // Add variant and custom class
      disabled={disabled}
      style={combinedStyle}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
