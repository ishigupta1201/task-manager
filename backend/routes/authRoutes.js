const express = require('express');
const { check } = require('express-validator'); // For input validation
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth'); // For protected routes

const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Auth
 * description: User authentication and authorization
 */

/**
 * @swagger
 * /api/auth/register:
 * post:
 * summary: Register a new user
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * password:
 * type: string
 * format: password
 * role:
 * type: string
 * enum: [user, admin]
 * default: user
 * responses:
 * 201:
 * description: User registered successfully.
 * 400:
 * description: Invalid input or user already exists.
 */
router.post(
  '/register',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  authController.registerUser
);

/**
 * @swagger
 * /api/auth/login:
 * post:
 * summary: Log in a user
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * password:
 * type: string
 * format: password
 * responses:
 * 200:
 * description: User logged in successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * token:
 * type: string
 * user:
 * type: object
 * properties:
 * _id:
 * type: string
 * email:
 * type: string
 * role:
 * type: string
 * 400:
 * description: Invalid credentials.
 */
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  authController.loginUser
);

/**
 * @swagger
 * /api/auth:
 * get:
 * summary: Get authenticated user's details
 * tags: [Auth]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: User data retrieved successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * _id:
 * type: string
 * email:
 * type: string
 * role:
 * type: string
 * 401:
 * description: Unauthorized (No token or token invalid).
 */
router.get('/', authMiddleware, authController.getLoggedInUser); // Protected route

module.exports = router;