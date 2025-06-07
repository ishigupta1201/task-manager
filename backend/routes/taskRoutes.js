const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth'); // For authentication
const authorizeRoles = require('../middleware/roleMiddleware'); // For role-based authorization
const constants = require('../config/constants'); // For user roles

const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Users
 * description: User management operations (Admin only)
 */

/**
 * @swagger
 * /api/users:
 * get:
 * summary: Get all users (Admin only)
 * tags: [Users]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: A list of users.
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/UserSummary'
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden (user not an admin).
 * 500:
 * description: Server error.
 */
router.get(
  '/',
  authMiddleware,
  authorizeRoles([constants.USER_ROLES.ADMIN]), // Only admins can access this route
  userController.getUsers
);

/**
 * @swagger
 * /api/users/{id}:
 * put:
 * summary: Update a user's details (Admin only)
 * tags: [Users]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: string
 * required: true
 * description: The user ID
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * email:
 * type: string
 * format: email
 * description: New email for the user
 * role:
 * type: string
 * enum: [user, admin]
 * description: New role for the user
 * responses:
 * 200:
 * description: User updated successfully.
 * 400:
 * description: Invalid input or cannot update own account.
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden (user not an admin or trying to modify self).
 * 404:
 * description: User not found.
 * 500:
 * description: Server error.
 */
router.put(
  '/:id',
  authMiddleware,
  authorizeRoles([constants.USER_ROLES.ADMIN]), // Only admins can access this route
  [
    check('email', 'Please include a valid email').optional().isEmail(),
    check('role', `Role must be one of: ${Object.values(constants.USER_ROLES).join(', ')}`).optional().isIn(Object.values(constants.USER_ROLES)),
  ],
  userController.updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 * delete:
 * summary: Delete a user (Admin only)
 * tags: [Users]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: string
 * required: true
 * description: The user ID
 * responses:
 * 200:
 * description: User deleted successfully.
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden (user not an admin or trying to delete self).
 * 404:
 * description: User not found.
 * 500:
 * description: Server error.
 */
router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles([constants.USER_ROLES.ADMIN]), // Only admins can access this route
  userController.deleteUser
);

module.exports = router;