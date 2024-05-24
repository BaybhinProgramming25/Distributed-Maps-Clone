const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true  },
  loggedin : { type : Boolean, required : true},
  verified: { type: Boolean, default: false },
  key: { type: String },
});

const User = mongoose.model('Users', userSchema, 'users'); 

module.exports = User;
