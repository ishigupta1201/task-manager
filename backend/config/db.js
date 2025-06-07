const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' }); // Load environment variables from backend/.env

const connectDB = async () => {
  if(!process.env.MONGO_URI){
    console.error('Error: MONGO_URI is not defined in environment variables. Please check your .env file.');
    process.exit(1); // Exit if critical variable is missing
  }
  try {
    // Attempt to connect to MongoDB using the URI from environment variables
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are recommended to avoid deprecation warnings
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useCreateIndex: true, // Deprecated in Mongoose 6+
      // useFindAndModify: false, // Deprecated in Mongoose 6+
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;