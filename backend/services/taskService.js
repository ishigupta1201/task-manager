// backend/services/taskService.js
const Task = require('../models/Task');
const User = require('../models/User'); // Required for populating user details
const constants = require('../config/constants');
const fs = require('fs');
const path = require('path');

// This service layer can encapsulate complex queries, business rules, or external API calls.
// For simple CRUD, some logic might seem duplicated from controllers, but it's for scalability.

const taskService = {
  /**
   * Creates a new task in the database.
   * @param {object} taskData - Data for the new task.
   * @param {Array<object>} uploadedFiles - Array of file objects from Multer.
   * @returns {Promise<object>} The created task object.
   */
  async createTask(taskData, uploadedFiles = []) {
    const { title, description, status, priority, dueDate, assignedTo, createdBy } = taskData;

    const attachedDocuments = uploadedFiles.map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
    }));

    const newTask = new Task({
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      createdBy,
      attachedDocuments,
    });

    const savedTask = await newTask.save();
    await savedTask.populate('assignedTo', 'email').populate('createdBy', 'email');
    return savedTask;
  },

  /**
   * Fetches tasks based on filters and sorting.
   * @param {object} filters - Filter criteria (status, priority, dueDate, assignedTo, search).
   * @param {object} sortOptions - Sorting options (sortBy, sortOrder).
   * @param {object} paginationOptions - Pagination (page, limit).
   * @param {string} userId - ID of the current user for authorization.
   * @param {string} userRole - Role of the current user for authorization.
   * @returns {Promise<array>} Array of task objects.
   */
  async getTasks(filters, sortOptions, paginationOptions, userId, userRole) {
    const { status, priority, dueDate, assignedTo, search } = filters;
    const { sortBy, sortOrder } = sortOptions;
    const { page, limit } = paginationOptions;

    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (dueDate) query.dueDate = { $lte: new Date(dueDate) };
    if (assignedTo) query.assignedTo = assignedTo;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Role-based access control: regular users only see their own or assigned tasks
    if (userRole !== constants.USER_ROLES.ADMIN) {
      query.$or = [
        ...(query.$or || []),
        { createdBy: userId },
        { assignedTo: userId }
      ];
    }

    const sort = {};
    if (['createdAt', 'dueDate', 'priority', 'status', 'title'].includes(sortBy)) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1; // Default sort
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(query)
      .populate('assignedTo', 'email')
      .populate('createdBy', 'email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    return tasks;
  },

  /**
   * Fetches a single task by ID.
   * @param {string} taskId - The ID of the task.
   * @param {string} userId - ID of the current user for authorization.
   * @param {string} userRole - Role of the current user for authorization.
   * @returns {Promise<object>} The task object.
   * @throws {Error} If task not found or unauthorized.
   */
  async getTaskById(taskId, userId, userRole) {
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'email')
      .populate('createdBy', 'email');

    if (!task) {
      const error = new Error('Task not found.');
      error.statusCode = 404;
      throw error;
    }

    // Authorization check
    if (userRole !== constants.USER_ROLES.ADMIN &&
        task.createdBy.toString() !== userId &&
        task.assignedTo.toString() !== userId) {
      const error = new Error('Not authorized to view this task.');
      error.statusCode = 403;
      throw error;
    }

    return task;
  },

  /**
   * Updates an existing task.
   * @param {string} taskId - ID of the task to update.
   * @param {object} updateData - Data to update the task with.
   * @param {Array<object>} newFiles - Array of new file objects from Multer.
   * @param {Array<object>} existingDocsToRetain - Array of existing document objects to keep.
   * @param {string} userId - ID of the user performing the update.
   * @param {string} userRole - Role of the user performing the update.
   * @returns {Promise<object>} The updated task object.
   * @throws {Error} If task not found, unauthorized, or validation fails.
   */
  async updateTask(taskId, updateData, newFiles, existingDocsToRetain, userId, userRole) {
    let task = await Task.findById(taskId);

    if (!task) {
      const error = new Error('Task not found.');
      error.statusCode = 404;
      throw error;
    }

    // Authorization check
    if (userRole !== constants.USER_ROLES.ADMIN && task.createdBy.toString() !== userId) {
      const error = new Error('Not authorized to update this task.');
      error.statusCode = 403;
      throw error;
    }

    // Check if assignedTo user exists if it's being changed
    if (updateData.assignedTo && updateData.assignedTo !== task.assignedTo.toString()) {
      const assignee = await User.findById(updateData.assignedTo);
      if (!assignee) {
        const error = new Error('Assigned user not found.');
        error.statusCode = 400;
        throw error;
      }
    }

    // Document handling
    let combinedDocuments = [];
    let oldDocumentsToCleanUp = [];

    // Identify documents to remove from disk
    task.attachedDocuments.forEach(oldDoc => {
        if (!existingDocsToRetain.some(retainedDoc => retainedDoc._id === oldDoc._id.toString())) {
            oldDocumentsToCleanUp.push(oldDoc);
        }
    });

    // Clean up files that are no longer referenced
    oldDocumentsToCleanUp.forEach(doc => {
        if (fs.existsSync(doc.path)) {
            fs.unlinkSync(doc.path);
        }
    });

    // Combine retained existing documents with new files
    combinedDocuments = [
        ...task.attachedDocuments.filter(oldDoc => existingDocsToRetain.some(retainedDoc => retainedDoc._id === oldDoc._id.toString())),
        ...newFiles.map(file => ({ filename: file.originalname, path: file.path, mimetype: file.mimetype }))
    ];

    if (combinedDocuments.length > constants.MAX_DOCUMENTS_PER_TASK) {
        const error = new Error(`Maximum ${constants.MAX_DOCUMENTS_PER_TASK} documents allowed.`);
        error.statusCode = 400;
        throw error;
    }


    // Apply updates
    Object.keys(updateData).forEach(key => {
        if (key !== 'attachedDocuments' && key !== 'existingAttachedDocuments') { // Prevent direct overwrite of documents array
            task[key] = updateData[key];
        }
    });
    task.attachedDocuments = combinedDocuments; // Assign the new combined list of documents

    const updatedTask = await task.save();
    await updatedTask.populate('assignedTo', 'email').populate('createdBy', 'email');
    return updatedTask;
  },

  /**
   * Deletes a task by ID.
   * @param {string} taskId - ID of the task to delete.
   * @param {string} userId - ID of the user performing the deletion.
   * @param {string} userRole - Role of the user performing the deletion.
   * @returns {Promise<object>} Success message.
   * @throws {Error} If task not found or unauthorized.
   */
  async deleteTask(taskId, userId, userRole) {
    const task = await Task.findById(taskId);

    if (!task) {
      const error = new Error('Task not found.');
      error.statusCode = 404;
      throw error;
    }

    // Authorization check
    if (userRole !== constants.USER_ROLES.ADMIN && task.createdBy.toString() !== userId) {
      const error = new Error('Not authorized to delete this task.');
      error.statusCode = 403;
      throw error;
    }

    // Delete associated files from local storage
    if (task.attachedDocuments && task.attachedDocuments.length > 0) {
      task.attachedDocuments.forEach(doc => {
        if (fs.existsSync(doc.path)) {
          fs.unlinkSync(doc.path);
        }
      });
    }

    await Task.deleteOne({ _id: taskId });
    return { message: 'Task deleted successfully.' };
  },

  /**
   * Finds a document path by filename and checks task access.
   * @param {string} filename - The filename of the document.
   * @param {string} userId - ID of the user requesting the download.
   * @param {string} userRole - Role of the user requesting the download.
   * @returns {Promise<string>} The full path to the document on disk.
   * @throws {Error} If document not found, unauthorized, or file not on disk.
   */
  async getDocumentPath(filename, userId, userRole) {
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    // Security check: Prevent directory traversal
    if (!filePath.startsWith(path.join(__dirname, '..', 'uploads'))) {
        const error = new Error('Invalid file path.');
        error.statusCode = 400;
        throw error;
    }

    const task = await Task.findOne({ 'attachedDocuments.filename': filename });

    if (!task) {
        const error = new Error('Document not found or not associated with any task.');
        error.statusCode = 404;
        throw error;
    }

    // Authorization check
    if (userRole !== constants.USER_ROLES.ADMIN &&
        task.createdBy.toString() !== userId &&
        task.assignedTo.toString() !== userId) {
        const error = new Error('Not authorized to download this document.');
        error.statusCode = 403;
        throw error;
    }

    if (!fs.existsSync(filePath)) {
        const error = new Error('File not found on server.');
        error.statusCode = 404;
        throw error;
    }

    return filePath;
  },
};

module.exports = taskService;