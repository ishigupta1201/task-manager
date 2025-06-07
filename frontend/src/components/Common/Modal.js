import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import Button from './Button'; // Assuming Button.js is in the same Common folder

/**
 * Reusable Modal Component.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed (e.g., by clicking backdrop or close button).
 * @param {string} props.title - The title to display in the modal header.
 * @param {React.ReactNode} props.children - The content to be displayed inside the modal body.
 * @param {string} [props.className=''] - Additional CSS classes for custom styling.
 * @param {boolean} [props.showCloseButton=true] - Whether to display a close button in the header.
 * @param {boolean} [props.disableBackdropClick=false] - If true, clicking the backdrop will not close the modal.
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showCloseButton = true,
  disableBackdropClick = false,
}) => {
  const modalRef = useRef(null);

  // Effect to handle keyboard events (Escape key to close modal)
  useEffect(() => {
    const handleEscapePress = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapePress);

    return () => {
      document.removeEventListener('keydown', handleEscapePress);
    };
  }, [isOpen, onClose]);

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  // Render the modal into a portal to ensure it's on top of other content
  return ReactDOM.createPortal(
    <div
      style={backdropStyle}
      onClick={disableBackdropClick ? null : onClose} // Close on backdrop click unless disabled
    >
      <div
        ref={modalRef}
        style={{ ...modalStyle, ...getDynamicModalStyles() }}
        className={`modal-content ${className}`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {showCloseButton && (
            <Button
              onClick={onClose}
              variant="outline"
              style={closeButtonStyle}
              aria-label="Close modal"
            >
              &times; {/* HTML entity for multiplication sign, commonly used as a close icon */}
            </Button>
          )}
        </div>
        <div style={modalBodyStyle}>
          {children}
        </div>
      </div>
    </div>,
    document.body // Append the modal to the body element
  );
};

// --- Basic Inline Styles (You'd replace this with a CSS file or CSS-in-JS library) ---
const backdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000, // Ensure it's on top of most content
};

const modalStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '90vh', // Limit height for scrollable content
  overflowY: 'auto', // Enable scrolling for long content
  position: 'relative', // For positioning the close button
};

const getDynamicModalStyles = () => ({
  width: '90%', // Responsive width
  maxWidth: '500px', // Max width for larger screens
});

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '15px',
  borderBottom: '1px solid #eee',
  marginBottom: '15px',
};

const modalBodyStyle = {
  flexGrow: 1,
  paddingBottom: '10px',
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  color: '#666',
  cursor: 'pointer',
  padding: '0 5px',
};


export default Modal;