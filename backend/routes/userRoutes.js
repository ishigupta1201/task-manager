const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
// Corrected imports for middleware
const authMiddleware = require('../middleware/auth'); // Correctly import the auth middleware
const authorizeRoles = require('../middleware/roleMiddleware'); // Correctly import the role middleware
const constants = require('../config/constants'); // Import constants for user roles

const router = express.Router();

// Apply authMiddleware to all routes in this file (JWT verification)
// This ensures that req.user is populated before any route handler or role check runs.
router.use(authMiddleware); // THIS IS LINE 10

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', authorizeRoles([constants.USER_ROLES.ADMIN]), [ // Use authorizeRoles
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn([constants.USER_ROLES.USER, constants.USER_ROLES.ADMIN]),
  query('isActive').optional().isBoolean() // Assuming isActive exists in User model
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const users = await User.find(filter)
      .select('-password') // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    // Pass error to global error handler if present, or handle directly
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (user can view own, admin can view any)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Users can only view their own profile unless they're admin
    if (req.user.role !== constants.USER_ROLES.ADMIN && req.user.id !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    // Handle invalid ID format specifically
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ success: false, message: 'Invalid User ID format.' });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (user can update own, admin can update any)
router.put('/:id', [
  body('firstName').optional().trim().isLength({ max: 50 }).withMessage('First name cannot be empty and max 50 chars.'),
  body('lastName').optional().trim().isLength({ max: 50 }).withMessage('Last name cannot be empty and max 50 chars.'),
  body('role').optional().isIn([constants.USER_ROLES.USER, constants.USER_ROLES.ADMIN]).withMessage('Invalid role.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Users can only update their own profile unless they're admin
    if (req.user.role !== constants.USER_ROLES.ADMIN && req.user.id !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only admin can change role and isActive status
    if (req.user.role !== constants.USER_ROLES.ADMIN) {
      delete req.body.role;
      delete req.body.isActive;
    }

    // Update fields (only allow specific fields to be updated)
    const allowedUpdates = ['firstName', 'lastName', 'role', 'isActive'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) { // Check if the field exists in the request body
        user[field] = req.body[field];
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user.select('-password') // Return updated user without password
    });
  } catch (error) {
    console.error('Update user error:', error);
    // Handle invalid ID format specifically
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ success: false, message: 'Invalid User ID format.' });
    }
    // Handle duplicate email if trying to update email (e.g., error.code === 11000)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', authorizeRoles([constants.USER_ROLES.ADMIN]), async (req, res) => { // Use authorizeRoles
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === user._id.toString()) { // Compare string IDs
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    // Handle invalid ID format specifically
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ success: false, message: 'Invalid User ID format.' });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

module.exports = router;