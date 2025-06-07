const User = require('../models/User');
const { validationResult } = require('express-validator');
const constants = require('../config/constants'); // Import constants for roles

/**
 * @swagger
 * components:
 * schemas:
 * UserSummary:
 * type: object
 * properties:
 * _id:
 * type: string
 * description: The user ID
 * email:
 * type: string
 * format: email
 * description: The user's email
 * role:
 * type: string
 * enum: [user, admin]
 * description: The user's role
 * example:
 * _id: "60c72b2f9b1d8e001c8a1b2d"
 * email: "user@example.com"
 * role: "user"
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
 * description: Unauthorized (No token or token invalid).
 * 403:
 * description: Forbidden (User not an admin).
 * 500:
 * description: Server error.
 */
exports.getUsers = async (req, res) => {
  try {
    // Only allow admin users to fetch all users
    if (req.user.role !== constants.USER_ROLES.ADMIN) {
      return res.status(403).json({ message: 'Access denied. Only administrators can view all users.' });
    }

    // Fetch all users, excluding their passwords
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error fetching users.' });
  }
};

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
 * example:
 * email: newemail@example.com
 * role: admin
 * responses:
 * 200:
 * description: User updated successfully.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/UserSummary'
 * 400:
 * description: Invalid input or cannot update own account.
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden (User not an admin or trying to modify self).
 * 404:
 * description: User not found.
 * 500:
 * description: Server error.
 */
exports.updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  // Only allow admin users to update others
  if (req.user.role !== constants.USER_ROLES.ADMIN) {
    return res.status(403).json({ message: 'Access denied. Only administrators can update users.' });
  }

  // Prevent admin from changing their own role or email to prevent accidental lockout
  if (req.user.id === req.params.id) {
    return res.status(400).json({ message: 'Administrators cannot update their own account via this endpoint.' });
  }

  const { email, role } = req.body;
  const updateFields = {};
  if (email) updateFields.email = email;
  if (role) updateFields.role = role;

  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if new email already exists for another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Email already in use by another user.' });
      }
    }

    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true } // Return updated document and run schema validators
    ).select('-password'); // Exclude password from the response

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(500).json({ message: 'Server error during user update.' });
  }
};

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
 * description: Forbidden (User not an admin or trying to delete self).
 * 404:
 * description: User not found.
 * 500:
 * description: Server error.
 */
exports.deleteUser = async (req, res) => {
  // Only allow admin users to delete others
  if (req.user.role !== constants.USER_ROLES.ADMIN) {
    return res.status(403).json({ message: 'Access denied. Only administrators can delete users.' });
  }

  // Prevent admin from deleting their own account
  if (req.user.id === req.params.id) {
    return res.status(400).json({ message: 'Administrators cannot delete their own account.' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Delete user and associated tasks (optional: tasks could be reassigned or marked as deleted)
    // For simplicity, we will delete user and tasks associated with them as 'createdBy'.
    // If tasks are assigned, you might want to nullify `assignedTo` or reassign.
    await User.deleteOne({ _id: req.params.id });
    // Consider also removing tasks created by this user or reassigning them
    // await Task.deleteMany({ createdBy: req.params.id });

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(500).json({ message: 'Server error during user deletion.' });
  }
};