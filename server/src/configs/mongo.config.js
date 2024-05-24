const mongoose = require('mongoose');

// Connection URI
const uri = 'mongodb://mongo:27017/Users';

// Define our database
let database;

async function connectToMongoDB() {
  try {
    // Connect to the MongoDB server using Mongoose
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Access database
    database = mongoose.connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Function to get reference to the database
function getDatabase() {
  return database;
}

// Function to close the MongoDB connection
async function closeConnection() {
  try {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}

module.exports = { connectToMongoDB, getDatabase, closeConnection };
