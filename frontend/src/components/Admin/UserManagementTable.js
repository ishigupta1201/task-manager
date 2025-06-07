import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUser, deleteUser } from '../../redux/actions/userActions'; // User-related Redux actions
import Button from '../Common/Button'; // Reusable Button component
import Modal from '../Common/Modal';   // Reusable Modal component

/**
 * UserManagementTable Component.
 * Displays a table of all users and allows admin users to edit or delete them.
 * This component is intended for use in the Admin Panel.
 */
const UserManagementTable = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth); // Current logged-in user for self-protection

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // User object being edited

  // Fetch users on component mount
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleEditClick = (user) => {
    setEditingUser({ ...user }); // Create a copy to avoid direct state mutation
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (userId) => {
    // Confirmation before deleting
    if (window.confirm('Are you sure you want to delete this user?')) {
      dispatch(deleteUser(userId));
    }
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    // Re-fetch users to reflect any potential changes if the modal was closed without saving
    dispatch(fetchUsers());
  };

  const handleUserUpdate = (e) => {
    // This is for updating the user's role or email in the modal
    setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
  };

  const handleSaveUser = () => {
    if (editingUser) {
      dispatch(updateUser(editingUser._id, {
        email: editingUser.email,
        role: editingUser.role,
        // Password won't be updated here. A separate form would be needed for password reset by admin.
      }));
      // Check if update was successful via Redux state or local state.
      // For simplicity, we'll just close the modal and re-fetch.
      setIsEditModalOpen(false);
      setEditingUser(null);
      // Re-fetch to ensure table is up-to-date
      dispatch(fetchUsers());
    }
  };

  // Basic Inline Styles (Replace with your preferred CSS solution)
  const tableContainerStyle = {
    margin: '20px auto',
    maxWidth: '900px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: '20px',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  };

  const thStyle = {
    borderBottom: '2px solid #ddd',
    padding: '12px 8px',
    textAlign: 'left',
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
    color: '#333',
  };

  const tdStyle = {
    borderBottom: '1px solid #eee',
    padding: '10px 8px',
    verticalAlign: 'middle',
  };

  const actionsColumnStyle = {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-start',
  };

  const modalFormGroupStyle = {
    marginBottom: '15px',
  };

  const modalLabelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
  };

  const modalInputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box',
  };

  const modalButtonGroupStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  };

  return (
    <div style={tableContainerStyle}>
      <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#333' }}>User Management</h2>

      {loading && <p style={{ textAlign: 'center', color: '#007bff' }}>Loading users...</p>}
      {error && <p style={{ textAlign: 'center', color: '#dc3545' }}>Error: {error}</p>}

      {!loading && !error && users.length === 0 && (
        <p style={{ textAlign: 'center', color: '#6c757d' }}>No users found.</p>
      )}

      {!loading && !error && users.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.role}</td>
                <td style={tdStyle}>
                  <div style={actionsColumnStyle}>
                    {/* Admins cannot delete or edit their own accounts to prevent accidental lockout */}
                    {currentUser && currentUser._id !== user._id && (
                      <>
                        <Button
                          onClick={() => handleEditClick(user)}
                          variant="primary"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(user._id)}
                          variant="danger"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                    {currentUser && currentUser._id === user._id && (
                        <span style={{ color: '#6c757d', fontSize: '13px' }}>Cannot manage own account</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        title="Edit User"
      >
        {editingUser && (
          <div>
            <div style={modalFormGroupStyle}>
              <label htmlFor="editEmail" style={modalLabelStyle}>Email:</label>
              <input
                type="email"
                id="editEmail"
                name="email"
                value={editingUser.email}
                onChange={handleUserUpdate}
                style={modalInputStyle}
                disabled // Email usually not editable for primary identification
              />
            </div>
            <div style={modalFormGroupStyle}>
              <label htmlFor="editRole" style={modalLabelStyle}>Role:</label>
              <select
                id="editRole"
                name="role"
                value={editingUser.role}
                onChange={handleUserUpdate}
                style={modalInputStyle}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={modalButtonGroupStyle}>
              <Button onClick={handleModalClose} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleSaveUser} variant="primary">
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagementTable;