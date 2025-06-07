import React from 'react';
import Button from '../Common/Button'; // Reusable Button component

/**
 * TaskCard Component.
 * Displays a single task's summary and provides action buttons.
 *
 * @param {object} props - Component props.
 * @param {object} props.task - The task object to display. Expected properties:
 * - _id: string
 * - title: string
 * - description: string
 * - status: 'To Do' | 'In Progress' | 'Done'
 * - priority: 'Low' | 'Medium' | 'High'
 * - dueDate: string (ISO date string)
 * - assignedTo: object (e.g., { _id: string, email: string }) or null
 * - createdBy: object (e.g., { _id: string, email: string })
 * - attachedDocuments: array of objects (e.g., { filename: string, path: string })
 * @param {function} props.onView - Callback when "View" button is clicked.
 * @param {function} props.onEdit - Callback when "Edit" button is clicked.
 * @param {function} props.onDelete - Callback when "Delete" button is clicked.
 * @param {string} props.currentUserId - The ID of the currently logged-in user.
 * @param {string} props.currentUserRole - The role of the currently logged-in user ('user' or 'admin').
 */
const TaskCard = ({ task, onView, onEdit, onDelete, currentUserId, currentUserRole }) => {
  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Determine if the current user can edit/delete the task
  // Admins can manage any task. Regular users can only manage their own tasks.
  const canManageTask = currentUserRole === 'admin' || task.createdBy._id === currentUserId;

  // Inline styles for basic presentation. Replace with a CSS module or framework.
  const cardStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '15px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  const titleStyle = {
    margin: '0 0 10px 0',
    color: '#333',
  };

  const detailStyle = {
    fontSize: '14px',
    color: '#555',
  };

  const actionsStyle = {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    justifyContent: 'flex-end',
  };

  // Status and Priority Badges
  const getBadgeStyle = (value, type) => {
    let backgroundColor = '#ccc';
    let color = '#333';

    if (type === 'status') {
      switch (value) {
        case 'To Do': backgroundColor = '#f0ad4e'; color = 'white'; break; // Orange
        case 'In Progress': backgroundColor = '#5bc0de'; color = 'white'; break; // Blue
        case 'Done': backgroundColor = '#5cb85c'; color = 'white'; break; // Green
        default: break;
      }
    } else if (type === 'priority') {
      switch (value) {
        case 'Low': backgroundColor = '#5cb85c'; break; // Green
        case 'Medium': backgroundColor = '#f0ad4e'; break; // Orange
        case 'High': backgroundColor = '#dc3545'; color = 'white'; break; // Red
        default: break;
      }
    }

    return {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      backgroundColor: backgroundColor,
      color: color,
      marginRight: '8px',
    };
  };


  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>{task.title}</h3>
      <p style={detailStyle}>{task.description}</p>
      <div>
        <span style={getBadgeStyle(task.status, 'status')}>{task.status}</span>
        <span style={getBadgeStyle(task.priority, 'priority')}>{task.priority}</span>
      </div>
      <p style={detailStyle}>**Due Date:** {formatDate(task.dueDate)}</p>
      <p style={detailStyle}>**Assigned To:** {task.assignedTo ? task.assignedTo.email : 'Unassigned'}</p>
      <p style={detailStyle}>**Created By:** {task.createdBy ? task.createdBy.email : 'Unknown'}</p>

      <div style={actionsStyle}>
        <Button onClick={() => onView(task)} variant="secondary">
          View
        </Button>
        {canManageTask && (
          <>
            <Button onClick={() => onEdit(task)} variant="primary">
              Edit
            </Button>
            <Button onClick={() => onDelete(task._id)} variant="danger">
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskCard;