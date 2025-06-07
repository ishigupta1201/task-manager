const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required.'], // <<< Must be provided by frontend
    unique: true, // <<< This is where E11000 errors come from
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address.'],
  },
  password: {
    type: String,
    required: [true, 'Password is required.'], // <<< Must be provided by frontend
    minlength: [6, 'Password must be at least 6 characters long.'],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  // If you added firstName, lastName, isActive, etc. and they are NOT required
  // or are not being sent by the frontend's RegisterForm, ensure they are optional.
  // Example if they are optional:
  // firstName: { type: String, trim: true, maxlength: 50 },
  // lastName: { type: String, trim: true, maxlength: 50 },
  // isActive: { type: Boolean, default: true },
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
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare entered password with hashed password in the database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);