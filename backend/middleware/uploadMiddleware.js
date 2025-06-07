const multer = require('multer');
const path = require('path');
const fs = require('fs');
const constants = require('../config/constants'); // Import constants for file types and limits

// Define the directory for uploads
const uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Files will be stored in the 'uploads' directory
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter files to allow only specific MIME types (e.g., PDF)
const fileFilter = (req, file, cb) => {
  if (constants.ALLOWED_DOCUMENT_MIMETYPES.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    // Reject the file and provide an error message
    cb(new Error('Invalid file type. Only PDF documents are allowed.'), false);
  }
};

// Configure Multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE-SIZE) || (5 * 1024 * 1024), // 5 MB file size limit per file (adjust as needed)
    files: constants.MAX_DOCUMENTS_PER_TASK, // Max number of files per task 
  },
});

// Custom error handling for Multer errors
// This wraps the Multer upload and provides more consistent error messages
const uploadMiddleware = (req, res, next) => {
  upload.array('attachedDocuments', constants.MAX_DOCUMENTS_PER_TASK)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Max 5MB per file.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: `Too many files. Max ${constants.MAX_DOCUMENTS_PER_TASK} documents allowed.` });
      }
      // Other Multer errors
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // An unknown error occurred when uploading (e.g., from fileFilter)
      return res.status(400).json({ message: err.message });
    }
    // Everything went fine, proceed to the next middleware/controller
    next();
  });
};

module.exports = uploadMiddleware;