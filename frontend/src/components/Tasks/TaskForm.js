import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTask, updateTask } from '../../redux/actions/taskActions'; // Task-related Redux actions
import { fetchUsers } from '../../redux/actions/userActions'; // Action to fetch users for assignment
import Button from '../Common/Button'; // Reusable Button component

/**
 * TaskForm Component.
 * Used for creating new tasks or editing existing ones.
 *
 * @param {object} props - Component props.
 * @param {object} [props.task={}] - The task object to pre-fill the form if editing. Empty for new task.
 * @param {function} props.onClose - Callback to close the form/modal.
 */
const TaskForm = ({ task = {}, onClose }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.tasks); // Task creation/update state
  const { users } = useSelector((state) => state.users); // List of users for assignment
  const { user: currentUser } = useSelector((state) => state.auth); // Current logged-in user

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To Do', // Default status
    priority: 'Low', // Default priority
    dueDate: '',
    assignedTo: '', // User ID
  });

  const [selectedFiles, setSelectedFiles] = useState([]); // For new files to be uploaded
  const [existingDocuments, setExistingDocuments] = useState([]); // For documents already attached to an existing task
  const [errors, setErrors] = useState({}); // Client-side validation errors
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Destructure formData for easier access
  const { title, description, status, priority, dueDate, assignedTo } = formData;

  // Effect to populate form when editing an existing task
  useEffect(() => {
    if (task && task._id) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'To Do',
        priority: task.priority || 'Low',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', // Format for input type="date"
        assignedTo: task.assignedTo ? task.assignedTo._id : '',
      });
      setExistingDocuments(task.attachedDocuments || []);
    }
  }, [task]);

  // Effect to fetch users when component mounts or updates
  useEffect(() => {
    if (users.length === 0) { // Only fetch if users not already in Redux state
      dispatch(fetchUsers());
    }
  }, [dispatch, users.length]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear validation error for the field if it was set
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newErrors = { ...errors };

    // Combine existing and new files to check total count
    const totalFiles = existingDocuments.length + selectedFiles.length + files.length;

    if (totalFiles > 3) { // 
      newErrors.files = 'You can only attach a maximum of 3 documents.';
      setErrors(newErrors);
      return;
    }

    const validFiles = files.filter(file => {
      if (file.type !== 'application/pdf') { // 
        newErrors.files = newErrors.files ? `${newErrors.files}, ${file.name} is not a PDF.` : `${file.name} is not a PDF.`;
        return false;
      }
      return true;
    });

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
    } else {
        setErrors({}); // Clear file errors if everything is fine
    }

    setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const handleRemoveFile = (indexToRemove, type = 'new') => {
    if (type === 'new') {
      setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    } else if (type === 'existing') {
      // For existing documents, you'd typically send an API request to remove it from the backend.
      // For simplicity here, we'll just remove it from the local state.
      // In a real app, you'd mark for deletion or handle deletion during form submission.
      setExistingDocuments((prevDocs) => prevDocs.filter((_, index) => index !== indexToRemove));
      alert('Note: Removing an existing document here will not delete it from the server until the task is updated (this is a simplified client-side removal).');
    }
  };


  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!description.trim()) newErrors.description = 'Description is required.';
    if (!dueDate) newErrors.dueDate = 'Due Date is required.';
    if (!assignedTo) newErrors.assignedTo = 'Assignee is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionSuccess(false); // Reset success state

    if (!validateForm()) {
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('title', title);
    formDataToSend.append('description', description);
    formDataToSend.append('status', status);
    formDataToSend.append('priority', priority);
    formDataToSend.append('dueDate', dueDate);
    formDataToSend.append('assignedTo', assignedTo);
    formDataToSend.append('createdBy', currentUser._id); // Assuming createdBy is the current user

    // Append new files
    selectedFiles.forEach((file) => {
      formDataToSend.append('attachedDocuments', file); // 'attachedDocuments' must match the Multer field name on backend 
    });

    // If editing, also pass the IDs of existing documents that are *not* removed
    // This part assumes backend logic to handle existing document updates/deletions based on submitted list.
    // For simplicity, we are sending the `_id` and `path` of existing documents.
    existingDocuments.forEach(doc => {
        formDataToSend.append('existingAttachedDocuments', JSON.stringify({ _id: doc._id, path: doc.path }));
    });


    try {
      if (task && task._id) {
        // Editing existing task
        await dispatch(updateTask(task._id, formDataToSend));
      } else {
        // Creating new task
        await dispatch(createTask(formDataToSend));
        setFormData({ // Clear form after successful creation
          title: '',
          description: '',
          status: 'To Do',
          priority: 'Low',
          dueDate: '',
          assignedTo: '',
        });
        setSelectedFiles([]);
      }
      setSubmissionSuccess(true);
      // Optional: Close form after a short delay for user to see success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Task submission failed:', err);
      // Error message will be handled by Redux state 'error'
    }
  };

  // Basic Inline Styles (Replace with your preferred CSS solution)
  const formContainerStyle = {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    margin: '20px auto',
  };

  const formGroupStyle = {
    marginBottom: '15px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box',
  };

  const fileInputStyle = {
    ...inputStyle,
    border: 'none', // Remove border for file input visually
    padding: '0',
  };

  const errorTextStyle = {
    color: '#dc3545',
    fontSize: '13px',
    marginTop: '5px',
  };

  const buttonGroupStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  };

  const fileListStyle = {
    marginTop: '10px',
    border: '1px solid #eee',
    padding: '10px',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
  };

  const fileItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    borderBottom: '1px solid #eee',
  };

  return (
    <div style={formContainerStyle}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
        {task && task._id ? 'Edit Task' : 'Create New Task'}
      </h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div style={formGroupStyle}>
          <label htmlFor="title" style={labelStyle}>Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter task title"
          />
          {errors.title && <p style={errorTextStyle}>{errors.title}</p>}
        </div>

        <div style={formGroupStyle}>
          <label htmlFor="description" style={labelStyle}>Description:</label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: '80px' }}
            placeholder="Enter task description"
          ></textarea>
          {errors.description && <p style={errorTextStyle}>{errors.description}</p>}
        </div>

        <div style={formGroupStyle}>
          <label htmlFor="status" style={labelStyle}>Status:</label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>

        <div style={formGroupStyle}>
          <label htmlFor="priority" style={labelStyle}>Priority:</label>
          <select
            id="priority"
            name="priority"
            value={priority}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div style={formGroupStyle}>
          <label htmlFor="dueDate" style={labelStyle}>Due Date:</label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={dueDate}
            onChange={handleChange}
            style={inputStyle}
          />
          {errors.dueDate && <p style={errorTextStyle}>{errors.dueDate}</p>}
        </div>

        <div style={formGroupStyle}>
          <label htmlFor="assignedTo" style={labelStyle}>Assigned To:</label>
          <select
            id="assignedTo"
            name="assignedTo"
            value={assignedTo}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">Select User</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.email} {user.role === 'admin' && '(Admin)'}
              </option>
            ))}
          </select>
          {errors.assignedTo && <p style={errorTextStyle}>{errors.assignedTo}</p>}
        </div>

        <div style={formGroupStyle}>
          <label htmlFor="attachedDocuments" style={labelStyle}>Attached Documents (PDF only, max 3):</label>
          <input
            type="file"
            id="attachedDocuments"
            name="attachedDocuments"
            multiple
            accept="application/pdf"
            onChange={handleFileChange}
            style={fileInputStyle}
          />
          {errors.files && <p style={errorTextStyle}>{errors.files}</p>}

          {(existingDocuments.length > 0 || selectedFiles.length > 0) && (
            <div style={fileListStyle}>
              <h4>Current Attachments:</h4>
              {existingDocuments.map((doc, index) => (
                <div key={`exist-${doc._id || index}`} style={fileItemStyle}>
                  <span>{doc.filename || doc.name} (Existing)</span>
                  <Button
                    type="button"
                    onClick={() => handleRemoveFile(index, 'existing')}
                    variant="danger"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {selectedFiles.map((file, index) => (
                <div key={`new-${index}`} style={fileItemStyle}>
                  <span>{file.name} (New)</span>
                  <Button
                    type="button"
                    onClick={() => handleRemoveFile(index, 'new')}
                    variant="danger"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p style={errorTextStyle}>Server Error: {error}</p>}
        {submissionSuccess && (
          <p style={{ color: '#28a745', textAlign: 'center', marginBottom: '15px' }}>
            Task {task._id ? 'updated' : 'created'} successfully!
          </p>
        )}

        <div style={buttonGroupStyle}>
          <Button type="button" onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} variant="primary">
            {loading ? (task._id ? 'Updating...' : 'Creating...') : (task._id ? 'Update Task' : 'Create Task')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;