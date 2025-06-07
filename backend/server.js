const path = require('path'); // Add this line
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Change this line

console.log('DEBUG: Value of process.env.MONGO_URI:', process.env.MONGO_URI); 

const app = require('./app'); // Import the Express application from app.js

console.log('Server.js: App module loaded.'); // Add this

// Load environment variables for the entire application here

console.log('Server.js: Environment variables loaded.'); // Add this

const PORT = process.env.PORT || 5000;

// Start the server by listening on the specified port
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL configured for CORS: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

console.log('Server.js: End of script.'); // Add this