import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, deleteTask, clearTaskState } from '../../redux/actions/taskActions';
import { fetchUsers } from '../../redux/actions/userActions';
import AppLayout from '../../layouts/AppLayout';
import TaskCard from '../../components/Tasks/TaskCard';
import TaskForm from '../../components/Tasks/TaskForm';
import TaskFilterSort from '../../components/Tasks/TaskFilterSort';
import Modal from '../../components/Common/Modal';
import Button from '../../components/Common/Button';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const { user: currentUser } = useSelector((state) => state.auth);
  const { users: allUsers } = useSelector((state) => state.users);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});

  const memoizedFetchTasks = useCallback(() => {
    dispatch(fetchTasks(currentFilters));
  }, [dispatch, currentFilters]);

  useEffect(() => {
    memoizedFetchTasks();
    // Safety check: Only dispatch fetchUsers if allUsers is an array and its length is 0
    // Or, more robustly, if allUsers is null or undefined initially.
    if (!allUsers || allUsers.length === 0) { // <--- ADDED SAFE CHECK HERE
      dispatch(fetchUsers());
    }
  }, [memoizedFetchTasks, dispatch, allUsers]); // <--- Changed dependency to allUsers (the array itself)

  useEffect(() => {
    return () => {
      dispatch(clearTaskState());
    };
  }, [dispatch]);

  const handleCreateTaskClick = () => {
    setEditingTask(null);
    setIsFormModalOpen(true);
  };

  const handleEditTaskClick = (task) => {
    setEditingTask(task);
    setIsFormModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await dispatch(deleteTask(taskId));
      memoizedFetchTasks();
    }
  };

  const handleViewTaskClick = (task) => {
    setSelectedTask(task);
    setIsViewModalOpen(true);
  };

  const handleFormModalClose = () => {
    setIsFormModalOpen(false);
    setEditingTask(null);
    memoizedFetchTasks();
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedTask(null);
  };

  const handleFilterSortChange = (filtersAndSort) => {
    setCurrentFilters(filtersAndSort);
  };

  const handleDownloadDocument = (documentPath, filename) => {
    const fullUrl = `${process.env.REACT_APP_API_BASE_URL.replace('/api', '')}/uploads/${filename}`;
    window.open(fullUrl, '_blank');
  };

  // --- Basic Inline Styles ---
  const pageContainerStyle = { /* ... */ };
  const headerStyle = { /* ... */ };
  const taskGridStyle = { /* ... */ };
  const messageStyle = { /* ... */ };
  const taskDetailStyle = { /* ... */ };
  const docListStyle = { /* ... */ };
  const docItemStyle = { /* ... */ };


  return (
    <AppLayout>
      <div style={pageContainerStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, color: '#333' }}>Your Tasks</h2>
          <Button onClick={handleCreateTaskClick} variant="primary">
            Create New Task
          </Button>
        </div>

        {/* Ensure allUsers is an array before passing to TaskFilterSort */}
        <TaskFilterSort onFilterChange={handleFilterSortChange} users={allUsers || []} /> {/* <--- ADDED SAFE CHECK HERE */}

        {loading && <p style={messageStyle}>Loading tasks...</p>}
        {error && <p style={{ ...messageStyle, color: '#dc3545' }}>Error: {error}</p>}

        {/* Ensure tasks is an array before checking length and mapping */}
        {!loading && !error && tasks && tasks.length === 0 && ( // <--- ADDED SAFE CHECK HERE
          <p style={messageStyle}>No tasks found matching your criteria. Create one!</p>
        )}

        <div style={taskGridStyle}>
          {/* Ensure tasks is an array before mapping */}
          {!loading && !error && tasks && tasks.map((task) => ( // <--- ADDED SAFE CHECK HERE
            <TaskCard
              key={task._id}
              task={task}
              onView={handleViewTaskClick}
              onEdit={handleEditTaskClick}
              onDelete={handleDeleteTask}
              currentUserId={currentUser?._id}
              currentUserRole={currentUser?.role}
            />
          ))}
        </div>

        <Modal
          isOpen={isFormModalOpen}
          onClose={handleFormModalClose}
          title={editingTask ? 'Edit Task' : 'Create New Task'}
        >
          <TaskForm task={editingTask} onClose={handleFormModalClose} />
        </Modal>

        <Modal
          isOpen={isViewModalOpen}
          onClose={handleViewModalClose}
          title={selectedTask ? `Task: ${selectedTask.title}` : 'Task Details'}
        >
          {selectedTask && (
            <div style={taskDetailStyle}>
              {/* ... task details display ... */}
              {selectedTask.attachedDocuments && selectedTask.attachedDocuments.length > 0 && ( // <--- Safe check for attachedDocuments
                <div>
                  <h4>Attached Documents:</h4>
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
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;