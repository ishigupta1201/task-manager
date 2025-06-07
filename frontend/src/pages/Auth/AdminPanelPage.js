import React from 'react';
import AdminLayout from '../../layouts/AdminLayout.js'; // The specialized layout for admin pages
import UserManagementTable from '../../components/Admin/UserManagementTable.js'; // Component to manage users

/**
 * AdminPanelPage Component.
 * This page serves as the main entry point for administrative functionalities.
 * It uses the AdminLayout to ensure only authorized users can access it.
 * Currently, it displays the UserManagementTable.
 */
const AdminPanelPage = () => {
  // Basic inline styles for the panel content.
  const panelContentStyle = {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  };

  return (
    <AdminLayout>
      {/* AdminLayout handles the authorization check and redirects if not an admin. */}
      {/* Once authorized, the children (this content) will be rendered. */}
      <div style={panelContentStyle}>
        {/* The UserManagementTable component contains the logic for listing, editing, and deleting users. */}
        <UserManagementTable />
      </div>
    </AdminLayout>
  );
};

export default AdminPanelPage;