const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const constants = require('../config/constants');

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
 * description: User's email address
 * password:
 * type: string
 * format: password
 * description: User's password (min 6 characters)
 * role:
 * type: string
 * enum: [user, admin]
 * default: user
 * description: User's role (defaults to 'user')
 * example:
 * email: test@example.com
 * password: password123
 * role: user
 * responses:
 * 201:
 * description: User registered successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * user:
 * $ref: '#/components/schemas/User'
 * 400:
 * description: Invalid input or User already exists.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * errors:
 * type: array
 * items:
 * type: object
 * properties:
 * msg:
 * type: string
 * param:
 * type: string
 */
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Auth Controller: Validation failed during registration:', errors.array()); // DEBUG LOG
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { email, password, role } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      console.log('Auth Controller: Registration attempt with existing email:', email); // DEBUG LOG
      return res.status(400).json({ message: 'User already exists.' });
    }

    user = new User({
      email,
      password,
      role: role || constants.DEFAULT_USER_ROLE, // Default to 'user' if not provided
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    console.log('Auth Controller: Prepared user object for saving:'); // DEBUG LOG
    console.log(user); // DEBUG LOG: Inspect the user object BEFORE saving
    console.log('Auth Controller: User password (hashed, not plain):', user.password ? 'HASHED' : 'UNDEFINED'); // DEBUG LOG

    const savedUser = await user.save(); // Capture the result of save()
    console.log('Auth Controller: User successfully saved to DB. Result:', savedUser); // DEBUG LOG: Inspect the saved user object

    // Respond with success message and basic user info
    res.status(201).json({ message: 'User registered successfully.', user: { email: savedUser.email, role: savedUser.role } });

  } catch (err) {
    console.error('Auth Controller: FATAL ERROR during user registration save operation:'); // DEBUG LOG: Make this STAND OUT
    console.error(err); // DEBUG LOG: Print the FULL error object, not just err.message

    // Check for specific Mongoose error types to send more informative responses
    if (err.code === 11000) { // MongoDB duplicate key error (e.g., if unique index fails for email)
      return res.status(400).json({ message: 'User with this email already exists.' });
    }
    if (err.name === 'ValidationError') { // Mongoose schema validation error (e.g., missing required field, minlength)
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: `Validation failed: ${messages.join(', ')}` });
    }
    // Generic server error for unhandled exceptions
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

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
 * description: User's email address
 * password:
 * type: string
 * format: password
 * description: User's password
 * example:
 * email: test@example.com
 * password: password123
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
 * description: JWT authentication token
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
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 */
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Auth Controller: Validation failed during login:', errors.array()); // DEBUG LOG
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      console.log('Auth Controller: Login attempt with non-existent email:', email); // DEBUG LOG
      return res.status(400).json({ message: 'Invalid Credentials.' });
    }

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Auth Controller: Login attempt with incorrect password for email:', email); // DEBUG LOG
      return res.status(400).json({ message: 'Invalid Credentials.' });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id, // Mongoose virtual getter for _id (which is _id.toString())
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      constants.JWT_SECRET,
      { expiresIn: constants.JWT_EXPIRES_IN },
      (err, token) => {
        if (err) {
          console.error('Auth Controller: JWT sign error:', err); // DEBUG LOG
          throw err; // Re-throw to be caught by outer try-catch
        }
        console.log('Auth Controller: User logged in, sending token for:', email); // DEBUG LOG
        res.json({
          token,
          user: {
            _id: user._id,
            email: user.email,
            role: user.role,
          },
        });
      }
    );
  } catch (err) {
    console.error('Auth Controller: FATAL ERROR during user login operation:', err); // DEBUG LOG
    console.error(err); // DEBUG LOG: Print the FULL error object
    res.status(500).json({ message: 'Server error during login.' });
  }
};

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
 * $ref: '#/components/schemas/User'
 * example:
 * _id: "60c72b2f9b1d8e001c8a1b2d"
 * email: "user@example.com"
 * role: "user"
 * 401:
 * description: Unauthorized (No token or token invalid).
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * 500:
 * description: Server error.
 */
exports.getLoggedInUser = async (req, res) => {
  try {
    // req.user is populated by authMiddleware after token verification
    const user = await User.findById(req.user.id).select('-password'); // Exclude password
    if (!user) {
      console.log('Auth Controller: Authenticated user ID not found in DB:', req.user.id); // DEBUG LOG
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    console.error('Auth Controller: FATAL ERROR getting logged-in user:', err); // DEBUG LOG
    console.error(err); // DEBUG LOG: Print the FULL error object
    res.status(500).json({ message: 'Server Error.' });
  }
};