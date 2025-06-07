require('dotenv').config({ path: './backend/.env' }); // Load environment variables

const constants = {
  // JWT Secret from environment variables
  // IMPORTANT: Ensure this is a strong, unpredictable string and kept secret.
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_please_change',

  // Default JWT expiration time (e.g., 1 hour)
  JWT_EXPIRES_IN: process.env.JWT_EXPIRE || '1h',

  // Default role for new users if not specified
  DEFAULT_USER_ROLE: 'user',

  // Roles available in the application
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin',
  },

  // Task Statuses
  TASK_STATUSES: ['To Do', 'In Progress', 'Done'],

  // Task Priorities
  TASK_PRIORITIES: ['Low', 'Medium', 'High'],

  // Maximum number of documents allowed per task
  MAX_DOCUMENTS_PER_TASK: 3,

  // Allowed document MIME types for uploads
  ALLOWED_DOCUMENT_MIMETYPES: ['application/pdf'],
};

module.exports = constants;