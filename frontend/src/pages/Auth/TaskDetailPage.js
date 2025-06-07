import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTaskById, deleteTask, clearTaskState } from '../../redux/actions/taskActions';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/Common/Button';
import TaskForm from '../../components/Tasks/TaskForm'; // Reusing TaskForm for editing
import Modal from '../../components/Common/Modal'; // Using Modal for the edit form
import { Link } from 'react-router-dom';


/**
 * TaskDetailPage Component.
 * Displays the full details of a single task, fetched by its ID from the URL.
 * Provides options to edit or delete the task.
 */
const TaskDetailPage = () => {
  const { id: taskId } = useParams(); // Get task ID from URL parameters
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedTask, loading, error } = useSelector((state) => state.tasks); // Renamed from 'task' for clarity
  const { user: currentUser } = useSelector((state) => state.auth); // Current authenticated user

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch task details when component mounts or taskId changes
  const memoizedFetchTask = useCallback(() => {
    if (taskId) {
      dispatch(fetchTaskById(taskId));
    }
  }, [dispatch, taskId]);

  useEffect(() => {
    memoizedFetchTask();
    // Clear task state on unmount
    return () => {
      dispatch(clearTaskState());
    };
  }, [memoizedFetchTask, dispatch]);

  // Check if current user can manage the task
  const canManageTask = currentUser && selectedTask &&
                        (currentUser.role === 'admin' || selectedTask.createdBy._id === currentUser._id);

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await dispatch(deleteTask(taskId));
      if (!error) { // If deletion was successful
        navigate('/dashboard'); // Redirect to dashboard
      }
    }
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    memoizedFetchTask(); // Re-fetch the task to show updated details
  };

  const handleDownloadDocument = (documentPath, filename) => {
    // Construct the full URL for the document.
    // Assuming backend serves static files from '/uploads'
    const fullUrl = `${process.env.REACT_APP_API_BASE_URL.replace('/api', '')}/uploads/${filename}`;
    window.open(fullUrl, '_blank'); // Open in new tab
  };

  // --- Basic Inline Styles ---
  const pageContainerStyle = {
    padding: '20px',
    maxWidth: '800px',
    margin: '20px auto',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  };

  const titleStyle = {
    textAlign: 'center',
    color: '#007bff',
    marginBottom: '20px',
    borderBottom: '2px solid #eee',
    paddingBottom: '15px',
  };

  const detailItemStyle = {
    marginBottom: '10px',
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#333',
  };

  const strongStyle = {
    fontWeight: 'bold',
    color: '#555',
    marginRight: '5px',
  };

  const actionsStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
  };

  const docListStyle = {
    listStyle: 'none',
    padding: 0,
    marginTop: '10px',
  };

  const docItemStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '5px',
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={pageContainerStyle}>
          <p style={{ textAlign: 'center', fontSize: '18px', color: '#007bff' }}>Loading task details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div style={pageContainerStyle}>
          <p style={{ textAlign: 'center', fontSize: '18px', color: '#dc3545' }}>Error: {error}</p>
          <p style={{ textAlign: 'center' }}>Please try again or go back to <Link to="/dashboard">Dashboard</Link>.</p>
        </div>
      </AppLayout>
    );
  }

  if (!selectedTask) {
    return (
      <AppLayout>
        <div style={pageContainerStyle}>
          <p style={{ textAlign: 'center', fontSize: '18px', color: '#6c757d' }}>Task not found or you do not have permission to view it.</p>
          <p style={{ textAlign: 'center' }}>Go back to <Link to="/dashboard">Dashboard</Link>.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={pageContainerStyle}>
        <h2 style={titleStyle}>{selectedTask.title}</h2>

        <p style={detailItemStyle}><strong style={strongStyle}>Description:</strong> {selectedTask.description}</p>
        <p style={detailItemStyle}><strong style={strongStyle}>Status:</strong> {selectedTask.status}</p>
        <p style={detailItemStyle}><strong style={strongStyle}>Priority:</strong> {selectedTask.priority}</p>
        <p style={detailItemStyle}>
          <strong style={strongStyle}>Due Date:</strong> {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'N/A'}
        </p>
        <p style={detailItemStyle}>
          <strong style={strongStyle}>Assigned To:</strong> {selectedTask.assignedTo ? selectedTask.assignedTo.email : 'Unassigned'}
        </p>
        <p style={detailItemStyle}>
          <strong style={strongStyle}>Created By:</strong> {selectedTask.createdBy ? selectedTask.createdBy.email : 'Unknown User'}
        </p>
        <p style={detailItemStyle}>
          <strong style={strongStyle}>Created At:</strong> {new Date(selectedTask.createdAt).toLocaleString()}
        </p>
        <p style={detailItemStyle}>
          <strong style={strongStyle}>Last Updated:</strong> {new Date(selectedTask.updatedAt).toLocaleString()}
        </p>

        {selectedTask.attachedDocuments && selectedTask.attachedDocuments.length > 0 && (
          <div style={detailItemStyle}>
            <strong style={strongStyle}>Attached Documents:</strong>
            <ul style={docListStyle}>
              {selectedTask.attachedDocuments.map((doc) => (
                <li key={doc._id} style={docItemStyle}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDownloadDocument(doc.path, doc.filename);
                    }}
                    style={{ textDecoration: 'none', color: '#007bff', marginRight: '10px' }}
                  >
                    {doc.filename}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {canManageTask && (
          <div style={actionsStyle}>
            <Button onClick={handleEditClick} variant="primary">
              Edit Task
            </Button>
            <Button onClick={handleDeleteClick} variant="danger">
              Delete Task
            </Button>
          </div>
        )}

        {/* Task Form Modal for Editing */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          title="Edit Task"
        >
          {/* Pass the selectedTask to TaskForm for pre-filling */}
          <TaskForm task={selectedTask} onClose={handleEditModalClose} />
        </Modal>
      </div>
    </AppLayout>
  );
};

export default TaskDetailPage;