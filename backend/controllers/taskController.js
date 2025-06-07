const Task = require('../models/Task');
const User = require('../models/User'); // To populate assignedTo/createdBy fields
const { validationResult } = require('express-validator');
const constants = require('../config/constants');
const path = require('path');
const fs = require('fs'); // Node.js File System module

/**
 * @swagger
 * components:
 * schemas:
 * Task:
 * type: object
 * required:
 * - title
 * - description
 * - status
 * - priority
 * - dueDate
 * - assignedTo
 * - createdBy
 * properties:
 * _id:
 * type: string
 * description: The auto-generated ID of the task
 * title:
 * type: string
 * description: The title of the task
 * description:
 * type: string
 * description: A detailed description of the task
 * status:
 * type: string
 * enum: [To Do, In Progress, Done]
 * description: Current status of the task
 * priority:
 * type: string
 * enum: [Low, Medium, High]
 * description: Priority level of the task
 * dueDate:
 * type: string
 * format: date
 * description: The due date for the task
 * assignedTo:
 * type: object
 * description: The user to whom the task is assigned
 * properties:
 * _id:
 * type: string
 * email:
 * type: string
 * createdBy:
 * type: object
 * description: The user who created the task
 * properties:
 * _id:
 * type: string
 * email:
 * type: string
 * attachedDocuments:
 * type: array
 * description: List of attached document metadata
 * items:
 * type: object
 * properties:
 * _id:
 * type: string
 * filename:
 * type: string
 * path:
 * type: string
 * mimetype:
 * type: string
 * createdAt:
 * type: string
 * format: date-time
 * description: The date and time the task was created
 * updatedAt:
 * type: string
 * format: date-time
 * description: The date and time the task was last updated
 */

/**
 * @swagger
 * /api/tasks:
 * post:
 * summary: Create a new task
 * tags: [Tasks]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * required:
 * - title
 * - description
 * - status
 * - priority
 * - dueDate
 * - assignedTo
 * properties:
 * title:
 * type: string
 * description:
 * type: string
 * status:
 * type: string
 * enum: [To Do, In Progress, Done]
 * priority:
 * type: string
 * enum: [Low, Medium, High]
 * dueDate:
 * type: string
 * format: date
 * assignedTo:
 * type: string
 * description: User ID to whom the task is assigned
 * attachedDocuments:
 * type: array
 * items:
 * type: string
 * format: binary
 * maxItems: 3
 * description: Up to 3 PDF documents
 * responses:
 * 201:
 * description: Task created successfully.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Task'
 * 400:
 * description: Invalid input or User already exists.
 * 401:
 * description: Unauthorized.
 * 500:
 * description: Server error.
 */
exports.createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If validation fails, also remove any uploaded files
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { title, description, status, priority, dueDate, assignedTo } = req.body;
  const createdBy = req.user.id; // User ID from JWT

  // Process uploaded files if any
  const attachedDocuments = [];
  if (req.files && req.files.length > 0) {
    if (req.files.length > constants.MAX_DOCUMENTS_PER_TASK) {
      // Clean up excess files
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(400).json({ message: `Maximum ${constants.MAX_DOCUMENTS_PER_TASK} documents allowed.` });
    }
    req.files.forEach(file => {
      attachedDocuments.push({
        filename: file.originalname,
        path: file.path, // Store local path
        mimetype: file.mimetype,
      });
    });
  }

  try {
    // Check if assignedTo user exists
    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      // Clean up uploaded files if assignee doesn't exist
      if (req.files) {
        req.files.forEach(file => fs.unlinkSync(file.path));
      }
      return res.status(400).json({ message: 'Assigned user not found.' });
    }

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

    const task = await newTask.save();
    // Populate user details for the response
    await task.populate('assignedTo', 'email').populate('createdBy', 'email');
    res.status(201).json(task);
  } catch (err) {
    console.error(err.message);
    // Clean up uploaded files in case of server error
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    res.status(500).json({ message: 'Server error during task creation.' });
  }
};

/**
 * @swagger
 * /api/tasks:
 * get:
 * summary: Get all tasks with filtering, sorting, and pagination
 * tags: [Tasks]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: status
 * schema:
 * type: string
 * enum: [To Do, In Progress, Done]
 * description: Filter tasks by status
 * - in: query
 * name: priority
 * schema:
 * type: string
 * enum: [Low, Medium, High]
 * description: Filter tasks by priority
 * - in: query
 * name: dueDate
 * schema:
 * type: string
 * format: date
 * description: Filter tasks with due date before this date
 * - in: query
 * name: assignedTo
 * schema:
 * type: string
 * description: Filter tasks assigned to a specific user ID
 * - in: query
 * name: search
 * schema:
 * type: string
 * description: Search tasks by title or description (case-insensitive)
 * - in: query
 * name: sortBy
 * schema:
 * type: string
 * enum: [createdAt, dueDate, priority, status, title]
 * default: createdAt
 * description: Field to sort by
 * - in: query
 * name: sortOrder
 * schema:
 * type: string
 * enum: [asc, desc]
 * default: desc
 * description: Sort order (ascending or descending)
 * - in: query
 * name: page
 * schema:
 * type: integer
 * minimum: 1
 * default: 1
 * description: Page number for pagination
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * minimum: 1
 * default: 10
 * description: Number of tasks per page for pagination
 * responses:
 * 200:
 * description: A list of tasks.
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Task'
 * 401:
 * description: Unauthorized.
 * 500:
 * description: Server error.
 */
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, dueDate, assignedTo, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;
    const query = {};

    // Filtering 
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (dueDate) {
      // Filter tasks where dueDate is before or on the specified date
      query.dueDate = { $lte: new Date(dueDate) };
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    if (search) {
      // Case-insensitive search on title and description
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Role-based access control for fetching tasks 
    // Regular users can only see tasks they created or are assigned to.
    // Admins can see all tasks.
    if (req.user.role !== constants.USER_ROLES.ADMIN) {
      // If there's an existing $or condition, combine with it. Otherwise, create a new one.
      query.$or = [
        ...(query.$or || []),
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ];
    }

    // Sorting 
    const sort = {};
    if (['createdAt', 'dueDate', 'priority', 'status', 'title'].includes(sortBy)) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      // Default sort
      sort.createdAt = -1;
    }

    // Pagination 
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'email') // Populate assignedTo user's email 
      .populate('createdBy', 'email')   // Populate createdBy user's email 
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // For full pagination, you might also return total count: 
    // const totalTasks = await Task.countDocuments(query);
    // res.json({ tasks, totalPages: Math.ceil(totalTasks / limit), currentPage: parseInt(page) });

    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error fetching tasks.' });
  }
};

/**
 * @swagger
 * /api/tasks/{id}:
 * get:
 * summary: Get a single task by ID
 * tags: [Tasks]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: string
 * required: true
 * description: The task ID
 * responses:
 * 200:
 * description: Task details.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Task'
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden (user does not have permission to access this task).
 * 404:
 * description: Task not found.
 * 500:
 * description: Server error.
 */
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'email')
      .populate('createdBy', 'email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Check if user is authorized to view this task 
    // Admins can view any task. Regular users can only view tasks they created or are assigned to.
    if (req.user.role !== constants.USER_ROLES.ADMIN &&
        task.createdBy.toString() !== req.user.id &&
        task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this task.' });
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    // Check if it's a CastError (invalid ID format)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.status(500).json({ message: 'Server error fetching task.' });
  }
};

/**
 * @swagger
 * /api/tasks/{id}:
 * put:
 * summary: Update a task by ID
 * tags: [Tasks]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: string
 * required: true
 * description: The task ID
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * properties:
 * title:
 * type: string
 * description:
 * type: string
 * status:
 * type: string
 * enum: [To Do, In Progress, Done]
 * priority:
 * type: string
 * enum: [Low, Medium, High]
 * dueDate:
 * type: string
 * format: date
 * assignedTo:
 * type: string
 * description: User ID to whom the task is assigned
 * attachedDocuments:
 * type: array
 * items:
 * type: string
 * format: binary
 * maxItems: 3
 * description: New PDF documents to attach.
 * existingAttachedDocuments:
 * type: array
 * items:
 * type: string
 * description: JSON stringified array of existing document objects ({_id, path}) to retain. Files not in this list will be deleted.
 * responses:
 * 200:
 * description: Task updated successfully.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Task'
 * 400:
 * description: Invalid input.
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden (user does not have permission to update this task).
 * 404:
 * description: Task not found.
 * 500:
 * description: Server error.
 */
exports.updateTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If validation fails, also remove any newly uploaded files
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { title, description, status, priority, dueDate, assignedTo, existingAttachedDocuments } = req.body;

  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      // Clean up newly uploaded files if task not found
      if (req.files) {
        req.files.forEach(file => fs.unlinkSync(file.path));
      }
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Check if user is authorized to update this task 
    // Admins can update any task. Regular users can only update tasks they created.
    if (req.user.role !== constants.USER_ROLES.ADMIN && task.createdBy.toString() !== req.user.id) {
      // Clean up newly uploaded files if not authorized
      if (req.files) {
        req.files.forEach(file => fs.unlinkSync(file.path));
      }
      return res.status(403).json({ message: 'Not authorized to update this task.' });
    }

    // Check if assignedTo user exists
    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        // Clean up newly uploaded files if assignee doesn't exist
        if (req.files) {
          req.files.forEach(file => fs.unlinkSync(file.path));
        }
        return res.status(400).json({ message: 'Assigned user not found.' });
      }
    }

    // --- Document Handling Logic --- 
    let currentTaskDocuments = task.attachedDocuments || [];
    let docsToRetain = [];

    // Parse existingAttachedDocuments (which come as JSON strings from frontend)
    // It might come as a single string if only one item, or an array of strings
    if (existingAttachedDocuments) {
        const parsedExistingDocs = Array.isArray(existingAttachedDocuments)
            ? existingAttachedDocuments.map(JSON.parse)
            : [JSON.parse(existingAttachedDocuments)];

        // Filter out existing documents that are *not* in the request, and delete their files
        const documentsToRemove = currentTaskDocuments.filter(
            (doc) => !parsedExistingDocs.some(parsedDoc => parsedDoc._id === doc._id.toString())
        );

        documentsToRemove.forEach(doc => {
            if (fs.existsSync(doc.path)) {
                fs.unlinkSync(doc.path); // Delete file from server
            }
        });

        // Retain only the documents explicitly sent by the frontend
        docsToRetain = currentTaskDocuments.filter(
            (doc) => parsedExistingDocs.some(parsedDoc => parsedDoc._id === doc._id.toString())
        );
    } else {
        // If existingAttachedDocuments is not provided, it means all previous documents were removed.
        // Delete all existing files from the server.
        currentTaskDocuments.forEach(doc => {
            if (fs.existsSync(doc.path)) {
                fs.unlinkSync(doc.path);
            }
        });
        docsToRetain = [];
    }


    // Add new files from req.files
    const newAttachedDocuments = [];
    if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
            newAttachedDocuments.push({
                filename: file.originalname,
                path: file.path,
                mimetype: file.mimetype,
            });
        });
    }

    // Combine retained existing documents with newly uploaded documents
    const combinedDocuments = [...docsToRetain, ...newAttachedDocuments];

    // Check total document count 
    if (combinedDocuments.length > constants.MAX_DOCUMENTS_PER_TASK) {
        // Clean up newly uploaded files if total exceeds limit
        if (req.files) {
            req.files.forEach(file => fs.unlinkSync(file.path));
        }
        return res.status(400).json({ message: `Maximum ${constants.MAX_DOCUMENTS_PER_TASK} documents allowed.` });
    }

    // Update task fields
    task.title = title || task.title;
    task.description = description || task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;
    task.assignedTo = assignedTo || task.assignedTo;
    task.attachedDocuments = combinedDocuments; // Update with the new list of documents

    const updatedTask = await task.save();
    await updatedTask.populate('assignedTo', 'email').populate('createdBy', 'email');
    res.json(updatedTask);
  } catch (err) {
    console.error(err.message);
    // Clean up newly uploaded files in case of server error
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    // Check if it's a CastError (invalid ID format)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.status(500).json({ message: 'Server error during task update.' });
  }
};

/**
 * @swagger
 * /api/tasks/{id}:
 * delete:
 * summary: Delete a task by ID
 * tags: [Tasks]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: string
 * required: true
 * description: The task ID
 * responses:
 * 200:
 * description: Task deleted successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden (user does not have permission to delete this task).
 * 404:
 * description: Task not found.
 * 500:
 * description: Server error.
 */
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Check if user is authorized to delete this task 
    // Admins can delete any task. Regular users can only delete tasks they created.
    if (req.user.role !== constants.USER_ROLES.ADMIN && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this task.' });
    }

    // Delete associated files from local storage 
    if (task.attachedDocuments && task.attachedDocuments.length > 0) {
      task.attachedDocuments.forEach(doc => {
        if (fs.existsSync(doc.path)) {
          fs.unlinkSync(doc.path);
        }
      });
    }

    await Task.deleteOne({ _id: req.params.id }); // Using deleteOne for Mongoose 6+

    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    // Check if it's a CastError (invalid ID format)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.status(500).json({ message: 'Server error during task deletion.' });
  }
};

/**
 * @swagger
 * /api/tasks/documents/{filename}:
 * get:
 * summary: Download an attached document for a task
 * tags: [Tasks]
 * description: Provides a way to retrieve and download attached documents. Requires a task to be visible to the user.
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: filename
 * schema:
 * type: string
 * required: true
 * description: The filename of the document to download.
 * responses:
 * 200:
 * description: Document downloaded successfully.
 * content:
 * application/pdf:
 * schema:
 * type: string
 * format: binary
 * 400:
 * description: Invalid filename or file not found.
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden (user does not have permission to access the associated task or document).
 * 404:
 * description: Document not found.
 * 500:
 * description: Server error.
 */
exports.downloadDocument = async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads'), filename);

  // Security check: Prevent directory traversal 
  if (!filePath.startsWith(path.join(__dirname, '..', 'uploads'))) {
      return res.status(400).json({ message: 'Invalid file path.' });
  }

  try {
    // Before sending, ensure the user has access to a task that owns this document.
    // This adds a layer of security so random authenticated users can't download any file.
    const task = await Task.findOne({
      'attachedDocuments.filename': filename
    });

    if (!task) {
      return res.status(404).json({ message: 'Document not found or not associated with any task.' });
    }

    // Check if user is authorized to download this document (i.e., has access to the task) 
    if (req.user.role !== constants.USER_ROLES.ADMIN &&
        task.createdBy.toString() !== req.user.id &&
        task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to download this document.' });
    }

    // Check if the file actually exists on the disk
    if (fs.existsSync(filePath)) {
      res.download(filePath, filename); // Set Content-Disposition header for download
    } else {
      res.status(404).json({ message: 'File not found on server.' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error during document download.' });
  }
};