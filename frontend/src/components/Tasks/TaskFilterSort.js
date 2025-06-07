import React, { useState, useEffect } from 'react';
import Button from '../Common/Button'; // Reusable Button component

/**
 * TaskFilterSort Component.
 * Allows users to filter and sort tasks based on status, priority, due date, and assigned user.
 *
 * @param {object} props - Component props.
 * @param {object} props.onFilterChange - Callback function when filter/sort options change.
 * Receives an object with filter and sort parameters.
 * Example: { status: 'In Progress', priority: 'High', sortBy: 'dueDate', sortOrder: 'asc' }
 * @param {array} props.users - List of users to populate the "Assigned To" filter dropdown.
 */
const TaskFilterSort = ({ onFilterChange, users }) => {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    dueDate: '',
    assignedTo: '',
    search: '', // Added search for general keyword search
  });

  const [sort, setSort] = useState({
    sortBy: 'createdAt', // Default sort by creation date
    sortOrder: 'desc', // Default sort order
  });

  // Effect to trigger onFilterChange whenever filters or sort state changes
  // This debounces the filter changes to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      onFilterChange({ ...filters, ...sort });
    }, 300); // Debounce time in ms

    return () => {
      clearTimeout(handler);
    };
  }, [filters, sort, onFilterChange]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSortChange = (e) => {
    setSort({ ...sort, [e.target.name]: e.target.value });
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      dueDate: '',
      assignedTo: '',
      search: '',
    });
    setSort({
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    // onFilterChange will be triggered by the useEffect after state update
  };

  // Inline styles for basic presentation
  const filterContainerStyle = {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    alignItems: 'flex-end',
  };

  const formGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '150px',
  };

  const labelStyle = {
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px',
  };

  const inputStyle = {
    padding: '8px 10px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto', // Pushes buttons to the bottom of the container
  };

  return (
    <div style={filterContainerStyle}>
      {/* Search Input */}
      <div style={formGroupStyle}>
        <label htmlFor="search" style={labelStyle}>Search Title/Description:</label>
        <input
          type="text"
          id="search"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          style={inputStyle}
          placeholder="Search..."
        />
      </div>

      {/* Status Filter */}
      <div style={formGroupStyle}>
        <label htmlFor="status" style={labelStyle}>Status:</label>
        <select
          id="status"
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          style={inputStyle}
        >
          <option value="">All Statuses</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div style={formGroupStyle}>
        <label htmlFor="priority" style={labelStyle}>Priority:</label>
        <select
          id="priority"
          name="priority"
          value={filters.priority}
          onChange={handleFilterChange}
          style={inputStyle}
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      {/* Due Date Filter */}
      <div style={formGroupStyle}>
        <label htmlFor="dueDate" style={labelStyle}>Due Date (before):</label>
        <input
          type="date"
          id="dueDate"
          name="dueDate"
          value={filters.dueDate}
          onChange={handleFilterChange}
          style={inputStyle}
        />
      </div>

      {/* Assigned To Filter */}
      <div style={formGroupStyle}>
        <label htmlFor="assignedTo" style={labelStyle}>Assigned To:</label>
        <select
          id="assignedTo"
          name="assignedTo"
          value={filters.assignedTo}
          onChange={handleFilterChange}
          style={inputStyle}
        >
          <option value="">All Users</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.email}
            </option>
          ))}
        </select>
      </div>

      {/* Sort By */}
      <div style={formGroupStyle}>
        <label htmlFor="sortBy" style={labelStyle}>Sort By:</label>
        <select
          id="sortBy"
          name="sortBy"
          value={sort.sortBy}
          onChange={handleSortChange}
          style={inputStyle}
        >
          <option value="createdAt">Created At</option>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
          <option value="title">Title</option>
        </select>
      </div>

      {/* Sort Order */}
      <div style={formGroupStyle}>
        <label htmlFor="sortOrder" style={labelStyle}>Sort Order:</label>
        <select
          id="sortOrder"
          name="sortOrder"
          value={sort.sortOrder}
          onChange={handleSortChange}
          style={inputStyle}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      <div style={buttonGroupStyle}>
        <Button onClick={handleClearFilters} variant="secondary">
          Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default TaskFilterSort;