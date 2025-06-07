// backend/services/userService.js
const User = require('../models/User');
const constants = require('../config/constants'); // For user roles

const userService = {
  /**
   * Fetches all users, typically for administrative purposes.
   * @returns {Promise<array>} Array of user objects (excluding password).
   */
  async getAllUsers() {
    const users = await User.find().select('-password');
    return users;
  },

  /**
   * Updates a user's details.
   * @param {string} userId - ID of the user to update.
   * @param {object} updateData - Fields to update (e.g., email, role).
   * @returns {Promise<object>} The updated user object (excluding password).
   * @throws {Error} If user not found, email already in use, or validation fails.
   */
  async updateUser(userId, updateData) {
    let user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    // Check if new email already exists for another user
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser && existingUser._id.toString() !== userId) {
        const error = new Error('Email already in use by another user.');
        error.statusCode = 400;
        throw error;
      }
    }

    // Apply updates
    Object.keys(updateData).forEach(key => {
      user[key] = updateData[key];
    });

    const updatedUser = await user.save();
    return updatedUser.select('-password'); // Return user without password
  },

  /**
   * Deletes a user.
   * @param {string} userId - ID of the user to delete.
   * @returns {Promise<object>} Success message.
   * @throws {Error} If user not found.
   */
  async deleteUser(userId) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    await User.deleteOne({ _id: userId });
    // In a more complex app, you might also update/delete tasks associated with this user
    return { message: 'User deleted successfully.' };
  },
};

module.exports = userService;