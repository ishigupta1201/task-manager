const mongoose = require('mongoose');
const constants = require('../config/constants'); // Import task-related constants

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required.'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters.'],
  },
  description: {
    type: String,
    required: [true, 'Task description is required.'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters.'],
  },
  status: {
    type: String,
    enum: constants.TASK_STATUSES, // Enforce valid statuses from constants
    default: 'To Do',
  },
  priority: {
    type: String,
    enum: constants.TASK_PRIORITIES, // Enforce valid priorities from constants
    default: 'Low',
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required.'],
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: [true, 'Task must be assigned to a user.'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  attachedDocuments: [
    {
      filename: {
        type: String,
        required: true,
      },
      path: {
        type: String, // Local path or S3 URL
        required: true,
      },
      mimetype: {
        type: String,
        required: true,
      },
      // You could add size, uploadDate, etc. here
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Mongoose middleware to update 'updatedAt' field on save
TaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying by status, priority, dueDate, assignedTo, createdBy
TaskSchema.index({ status: 1, priority: 1, dueDate: 1, assignedTo: 1, createdBy: 1 });
// Index for full-text search on title and description
TaskSchema.index({ title: 'text', description: 'text' });


module.exports = mongoose.model('Task', TaskSchema);