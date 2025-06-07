// backend/tests/tasks.test.js
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const constants = require('../config/constants');
const path = require('path');
const fs = require('fs');

const testDbUri = process.env.MONGO_URI ? `${process.env.MONGO_URI}_test` : 'mongodb://localhost:27017/taskmanager_test';

let userToken;
let adminToken;
let userId;
let adminId;
let assignedUserId;
let assignedUserToken; // Token for a third user to assign tasks to

// Connect to test DB, create users, and get tokens
beforeAll(async () => {
  await mongoose.connect(testDbUri);

  // Clear collections
  await User.deleteMany({});
  await Task.deleteMany({});

  // Create a regular user
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'testuser@example.com', password: 'password123', role: 'user' });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testuser@example.com', password: 'password123' });
  userToken = loginRes.body.token;
  userId = loginRes.body.user._id;

  // Create an admin user
  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin@example.com', password: 'adminpassword', role: 'admin' });
  const adminLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'adminpassword' });
  adminToken = adminLoginRes.body.token;
  adminId = adminLoginRes.body.user._id;

  // Create another user for assignment tests
  const assignedUserRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'assigneduser@example.com', password: 'password123', role: 'user' });
  const assignedLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'assigneduser@example.com', password: 'password123' });
  assignedUserToken = assignedLoginRes.body.token;
  assignedUserId = assignedLoginRes.body.user._id;

  // Ensure uploads directory exists and is empty
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (fs.existsSync(uploadDir)) {
      fs.readdirSync(uploadDir).forEach(file => {
          fs.unlinkSync(path.join(uploadDir, file));
      });
  } else {
      fs.mkdirSync(uploadDir, { recursive: true });
  }
});

// After all tests, disconnect and clean up files
afterAll(async () => {
  await mongoose.connection.close();
  // Clean up any files left in the uploads directory
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (fs.existsSync(uploadDir)) {
      fs.readdirSync(uploadDir).forEach(file => {
          fs.unlinkSync(path.join(uploadDir, file));
      });
      // Optionally remove the directory itself
      // fs.rmdirSync(uploadDir);
  }
});

describe('Tasks API', () => {
  // Common task data
  const taskData = {
    title: 'Test Task',
    description: 'This is a test description.',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '2025-12-31',
  };

  // Helper to create a task
  const createTask = async (token, assignedToId = userId, overrideData = {}) => {
    const res = await request(app)
      .post('/api/tasks')
      .set('x-auth-token', token)
      .field('title', overrideData.title || taskData.title)
      .field('description', overrideData.description || taskData.description)
      .field('status', overrideData.status || taskData.status)
      .field('priority', overrideData.priority || taskData.priority)
      .field('dueDate', overrideData.dueDate || taskData.dueDate)
      .field('assignedTo', assignedToId);
    return res;
  };

  // Test Create Task
  it('should create a new task successfully', async () => {
    const res = await createTask(userToken);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toEqual(taskData.title);
    expect(res.body.createdBy._id).toEqual(userId); // Ensure createdBy is set correctly
    expect(res.body.assignedTo._id).toEqual(userId); // Ensure assignedTo is set correctly
  });

  // Test Create Task with attachments
  it('should create a task with PDF attachments', async () => {
    const testFilePath1 = path.join(__dirname, 'test_files', 'test1.pdf'); // Create dummy files
    const testFilePath2 = path.join(__dirname, 'test_files', 'test2.pdf'); // Create dummy files
    // Ensure test_files directory exists and contains dummy PDFs for testing
    if (!fs.existsSync(path.dirname(testFilePath1))) fs.mkdirSync(path.dirname(testFilePath1), { recursive: true });
    if (!fs.existsSync(testFilePath1)) fs.writeFileSync(testFilePath1, '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 0>>endobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\ntrailer<</Size 3/Root 1 0 R>>startxref\n106\n%%EOF');
    if (!fs.existsSync(testFilePath2)) fs.writeFileSync(testFilePath2, '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 0>>endobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\ntrailer<</Size 3/Root 1 0 R>>startxref\n106\n%%EOF');


    const res = await request(app)
      .post('/api/tasks')
      .set('x-auth-token', userToken)
      .field('title', 'Task with Docs')
      .field('description', 'Description with files.')
      .field('status', 'To Do')
      .field('priority', 'Low')
      .field('dueDate', '2025-12-31')
      .field('assignedTo', userId)
      .attach('attachedDocuments', testFilePath1)
      .attach('attachedDocuments', testFilePath2);

    expect(res.statusCode).toEqual(201);
    expect(res.body.attachedDocuments).toHaveLength(2);
    expect(res.body.attachedDocuments[0]).toHaveProperty('filename', 'test1.pdf');
    expect(res.body.attachedDocuments[1]).toHaveProperty('filename', 'test2.pdf');

    // Clean up created dummy files
    fs.unlinkSync(testFilePath1);
    fs.unlinkSync(testFilePath2);
  });

  // Test Create Task unauthorized
  it('should return 401 if not authenticated to create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send(taskData); // No token

    expect(res.statusCode).toEqual(401);
  });

  // Test Get All Tasks (User's own tasks)
  it('should get only tasks created by or assigned to the user', async () => {
    // Create a task by user
    await createTask(userToken, userId, { title: 'User Task 1' });
    // Create a task assigned to user
    await createTask(adminToken, userId, { title: 'Admin Assigned Task' });
    // Create a task not related to user (created by admin, assigned to different user)
    await createTask(adminToken, assignedUserId, { title: 'Unrelated Task' });

    const res = await request(app)
      .get('/api/tasks')
      .set('x-auth-token', userToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2); // Should include 'User Task 1' and 'Admin Assigned Task'
    expect(res.body.some(task => task.title === 'User Task 1')).toBe(true);
    expect(res.body.some(task => task.title === 'Admin Assigned Task')).toBe(true);
    expect(res.body.some(task => task.title === 'Unrelated Task')).toBe(false);
  });

  // Test Get All Tasks (Admin)
  it('should get all tasks for an admin user', async () => {
    await createTask(userToken, userId, { title: 'User Task 1' });
    await createTask(adminToken, assignedUserId, { title: 'Admin Task 1' });

    const res = await request(app)
      .get('/api/tasks')
      .set('x-auth-token', adminToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2); // Should include tasks from all users
    expect(res.body.some(task => task.title === 'User Task 1')).toBe(true);
    expect(res.body.some(task => task.title === 'Admin Task 1')).toBe(true);
  });

  // Test Get Task By ID
  it('should get a task by ID if authorized', async () => {
    const taskRes = await createTask(userToken);
    const taskId = taskRes.body._id;

    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('x-auth-token', userToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('_id', taskId);
  });

  // Test Get Task By ID Unauthorized
  it('should return 403 if user is not authorized to view task', async () => {
    // Create a task by admin, assigned to assignedUser
    const taskRes = await createTask(adminToken, assignedUserId, { title: 'Admin Only Task' });
    const taskId = taskRes.body._id;

    // Try to view with regular user token (not created by, not assigned to)
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('x-auth-token', userToken);

    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('message', 'Not authorized to view this task.');
  });

  // Test Update Task
  it('should update a task successfully if authorized', async () => {
    const taskRes = await createTask(userToken);
    const taskId = taskRes.body._id;

    const updatedTitle = 'Updated Task Title';
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('x-auth-token', userToken)
      .send({ title: updatedTitle, assignedTo: assignedUserId }); // Also test assigning to another user

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('title', updatedTitle);
    expect(res.body.assignedTo._id).toEqual(assignedUserId);
  });

  // Test Update Task with file removal/addition
  it('should update a task, remove an old file, and add a new file', async () => {
      const testFilePath1 = path.join(__dirname, 'test_files', 'update_old.pdf');
      const testFilePath2 = path.join(__dirname, 'test_files', 'update_new.pdf');
      if (!fs.existsSync(testFilePath1)) fs.writeFileSync(testFilePath1, '%PDF-1.4...\n');
      if (!fs.existsSync(testFilePath2)) fs.writeFileSync(testFilePath2, '%PDF-1.4...\n');

      // Create task with an initial file
      const initialTaskRes = await request(app)
          .post('/api/tasks')
          .set('x-auth-token', userToken)
          .field('title', 'Task with Initial File')
          .field('description', 'Desc')
          .field('status', 'To Do')
          .field('priority', 'Low')
          .field('dueDate', '2025-12-31')
          .field('assignedTo', userId)
          .attach('attachedDocuments', testFilePath1);
      const taskId = initialTaskRes.body._id;
      const initialDoc = initialTaskRes.body.attachedDocuments[0];

      // Update task: try to remove initialDoc (by not including it in existingAttachedDocuments)
      // and add a new file
      const res = await request(app)
          .put(`/api/tasks/${taskId}`)
          .set('x-auth-token', userToken)
          .field('title', 'Updated Task with New File')
          .field('description', 'Updated Desc')
          .field('status', 'In Progress')
          .field('priority', 'High')
          .field('dueDate', '2026-01-01')
          .field('assignedTo', userId)
          // Intentionally omitting 'initialDoc' from existingAttachedDocuments to delete it
          // .field('existingAttachedDocuments', JSON.stringify([{ _id: initialDoc._id, path: initialDoc.path }])) // If we wanted to keep it
          .attach('attachedDocuments', testFilePath2);

      expect(res.statusCode).toEqual(200);
      expect(res.body.title).toEqual('Updated Task with New File');
      expect(res.body.attachedDocuments).toHaveLength(1); // Only the new file should remain
      expect(res.body.attachedDocuments[0].filename).toEqual('test2.pdf');

      // Verify old file is deleted from disk (this check might be flaky due to async file ops)
      // You'd typically check this by trying to download it or listing the uploads directory
      // expect(fs.existsSync(path.join(__dirname, '..', 'uploads', initialDoc.filename))).toBe(false); // Filename might be different due to multer renaming
      // Better check: check if the path stored in DB for initialDoc no longer exists
      expect(fs.existsSync(initialDoc.path)).toBe(false);


      // Clean up new dummy file
      fs.unlinkSync(testFilePath1);
      fs.unlinkSync(testFilePath2);
  });


  // Test Update Task Unauthorized
  it('should return 403 if user is not authorized to update task', async () => {
    // Create task by admin
    const taskRes = await createTask(adminToken);
    const taskId = taskRes.body._id;

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('x-auth-token', userToken) // Try to update with regular user
      .send({ title: 'Attempted Update' });

    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('message', 'Not authorized to update this task.');
  });

  // Test Delete Task
  it('should delete a task successfully if authorized', async () => {
    const taskRes = await createTask(userToken);
    const taskId = taskRes.body._id;

    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('x-auth-token', userToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Task deleted successfully.');

    // Verify task is actually deleted from DB
    const deletedTask = await Task.findById(taskId);
    expect(deletedTask).toBeNull();
  });

  // Test Delete Task with associated files
  it('should delete a task and its associated files from storage', async () => {
      const testFilePath = path.join(__dirname, 'test_files', 'delete_with_file.pdf');
      if (!fs.existsSync(path.dirname(testFilePath))) fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      if (!fs.existsSync(testFilePath)) fs.writeFileSync(testFilePath, '%PDF-1.4...\n');

      const initialTaskRes = await request(app)
          .post('/api/tasks')
          .set('x-auth-token', userToken)
          .field('title', 'Task to Delete with File')
          .field('description', 'Desc')
          .field('status', 'To Do')
          .field('priority', 'Low')
          .field('dueDate', '2025-12-31')
          .field('assignedTo', userId)
          .attach('attachedDocuments', testFilePath);

      const taskId = initialTaskRes.body._id;
      const uploadedFilePath = initialTaskRes.body.attachedDocuments[0].path; // This is the path on server

      const deleteRes = await request(app)
          .delete(`/api/tasks/${taskId}`)
          .set('x-auth-token', userToken);

      expect(deleteRes.statusCode).toEqual(200);
      expect(deleteRes.body).toHaveProperty('message', 'Task deleted successfully.');

      // Verify the file is deleted from disk
      expect(fs.existsSync(uploadedFilePath)).toBe(false);

      fs.unlinkSync(testFilePath); // Clean up the dummy file used for upload
  });


  // Test Delete Task Unauthorized
  it('should return 403 if user is not authorized to delete task', async () => {
    const taskRes = await createTask(adminToken); // Task created by admin
    const taskId = taskRes.body._id;

    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('x-auth-token', userToken); // Regular user tries to delete admin's task

    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('message', 'Not authorized to delete this task.');
  });

  // Test Download Document
  it('should allow authorized user to download a document', async () => {
      const testFilePath = path.join(__dirname, 'test_files', 'download_me.pdf');
      if (!fs.existsSync(path.dirname(testFilePath))) fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      if (!fs.existsSync(testFilePath)) fs.writeFileSync(testFilePath, '%PDF-1.4\n% Dummy PDF Content for test\n%%EOF');

      const taskRes = await request(app)
          .post('/api/tasks')
          .set('x-auth-token', userToken)
          .field('title', 'Download Test Task')
          .field('description', 'Desc')
          .field('status', 'To Do')
          .field('priority', 'Low')
          .field('dueDate', '2025-12-31')
          .field('assignedTo', userId)
          .attach('attachedDocuments', testFilePath);

      const filename = taskRes.body.attachedDocuments[0].filename; // Get the Multer-generated filename
      const uploadedFilePath = taskRes.body.attachedDocuments[0].path;

      const downloadRes = await request(app)
          .get(`/api/tasks/documents/${filename}`)
          .set('x-auth-token', userToken);

      expect(downloadRes.statusCode).toEqual(200);
      expect(downloadRes.headers['content-type']).toEqual('application/pdf');
      expect(downloadRes.headers['content-disposition']).toMatch(/attachment; filename=/);
      expect(downloadRes.text).toEqual('%PDF-1.4\n% Dummy PDF Content for test\n%%EOF');

      // Clean up the created dummy file and uploaded file
      fs.unlinkSync(testFilePath);
      // Ensure the actual file on the server (uploadedFilePath) is removed during afterAll or explicitly here.
      // For this test, it's covered by afterAll's cleanup.
  });

  it('should return 403 if unauthorized user tries to download a document', async () => {
      const testFilePath = path.join(__dirname, 'test_files', 'private_doc.pdf');
      if (!fs.existsSync(path.dirname(testFilePath))) fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      if (!fs.existsSync(testFilePath)) fs.writeFileSync(testFilePath, '%PDF-1.4\n% Private PDF Content\n%%EOF');

      const taskRes = await request(app)
          .post('/api/tasks')
          .set('x-auth-token', adminToken) // Task created by admin
          .field('title', 'Admin Private Task')
          .field('description', 'Desc')
          .field('status', 'To Do')
          .field('priority', 'Low')
          .field('dueDate', '2025-12-31')
          .field('assignedTo', assignedUserId) // Assigned to another user
          .attach('attachedDocuments', testFilePath);

      const filename = taskRes.body.attachedDocuments[0].filename;

      const downloadRes = await request(app)
          .get(`/api/tasks/documents/${filename}`)
          .set('x-auth-token', userToken); // User tries to download, not authorized

      expect(downloadRes.statusCode).toEqual(403);
      expect(downloadRes.body).toHaveProperty('message', 'Not authorized to download this document.');

      fs.unlinkSync(testFilePath);
  });


});