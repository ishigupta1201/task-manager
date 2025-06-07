// backend/tests/auth.test.js
const request = require('supertest');
const app = require('../app'); // Your Express app
const mongoose = require('mongoose');
const User = require('../models/User'); // User model
const constants = require('../config/constants'); // For roles

// Use a test database URI. Make sure this points to a separate database
// or consider using 'mongodb-memory-server' for in-memory testing.
const testDbUri = process.env.MONGO_URI ? `${process.env.MONGO_URI}_test` : 'mongodb://localhost:27017/taskmanager_test';

// Before all tests, connect to the test database
beforeAll(async () => {
  await mongoose.connect(testDbUri);
});

// Before each test, clear the users collection
beforeEach(async () => {
  await User.deleteMany({});
});

// After all tests, disconnect from the database
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth API', () => {
  const userCredentials = {
    email: 'testuser@example.com',
    password: 'password123',
  };
  const adminCredentials = {
    email: 'admin@example.com',
    password: 'adminpassword',
    role: 'admin',
  };

  // Test User Registration
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userCredentials);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully.');
    expect(res.body.user).toHaveProperty('email', userCredentials.email);
    expect(res.body.user).toHaveProperty('role', constants.DEFAULT_USER_ROLE);

    const user = await User.findOne({ email: userCredentials.email });
    expect(user).toBeDefined();
    expect(await user.matchPassword(userCredentials.password)).toBe(true);
  });

  // Test Admin Registration
  it('should register a new admin successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(adminCredentials);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully.');
    expect(res.body.user).toHaveProperty('email', adminCredentials.email);
    expect(res.body.user).toHaveProperty('role', 'admin');
  });

  // Test Registration with existing email
  it('should not register a user with an already existing email', async () => {
    await request(app).post('/api/auth/register').send(userCredentials); // First registration

    const res = await request(app)
      .post('/api/auth/register')
      .send(userCredentials); // Second registration with same email

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'User already exists.');
  });

  // Test Registration with invalid email
  it('should return 400 for invalid email during registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid-email', password: 'password123' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.errors[0]).toHaveProperty('msg', 'Please include a valid email');
  });

  // Test User Login
  it('should log in an existing user successfully and return a token', async () => {
    // First, register the user
    await request(app).post('/api/auth/register').send(userCredentials);

    const res = await request(app)
      .post('/api/auth/login')
      .send(userCredentials);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', userCredentials.email);
    expect(res.body.user).toHaveProperty('role', constants.DEFAULT_USER_ROLE);
  });

  // Test Login with invalid password
  it('should not log in with invalid credentials (wrong password)', async () => {
    await request(app).post('/api/auth/register').send(userCredentials);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userCredentials.email, password: 'wrongpassword' });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Invalid Credentials.');
  });

  // Test Login with non-existent email
  it('should not log in with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'password123' });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Invalid Credentials.');
  });

  // Test Get Authenticated User (Protected Route)
  it('should get authenticated user details with a valid token', async () => {
    // Register and login to get a token
    await request(app).post('/api/auth/register').send(userCredentials);
    const loginRes = await request(app).post('/api/auth/login').send(userCredentials);
    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/auth')
      .set('x-auth-token', token);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('email', userCredentials.email);
    expect(res.body).toHaveProperty('role', constants.DEFAULT_USER_ROLE);
    expect(res.body).not.toHaveProperty('password'); // Password should not be returned
  });

  // Test Get Authenticated User (No Token)
  it('should return 401 if no token is provided for protected route', async () => {
    const res = await request(app).get('/api/auth');

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'No token, authorization denied.');
  });

  // Test Get Authenticated User (Invalid Token)
  it('should return 401 if an invalid token is provided', async () => {
    const res = await request(app)
      .get('/api/auth')
      .set('x-auth-token', 'invalidtoken123');

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Token is not valid.');
  });
});