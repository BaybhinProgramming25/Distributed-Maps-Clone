const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();

const generateSecretKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

router.use(session({
  secret: generateSecretKey(), 
  resave: false,
  saveUninitialized: false
}));


// Add User route 
router.post('/api/adduser', async (req, res) => {

  try {

    const { username, password, email } = req.body;

    console.log(req.body)

    const existingUser = await User.findOne({ $or: [{ username }, { email  }] });

    if (existingUser) {
      console.log('Username or email already exists:', existingUser);
      return res.status(200).json({ status : "ERROR", message : 'Username or email already exists' });
    }

    const newUser = new User({ username, password, email , loggedin: false, verified: false, key }); 

    const key = crypto.randomBytes(20).toString('hex');
    
    if(!sendVerificationEmail(email, key)) {
      console.log('Error sending verification email');
      return res.status(500).json({ error: 'Error sending verification email' });
    }
    
    await newUser.save(); 

    console.log('New user added successfully:');
    res.status(200).json({ status : 'ok', message: 'User Successfully Added!' });

  } catch (error) {

    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify route
router.get('/api/verify', async (req, res) => {

  try {

    const { email, key } = req.query;
    const processedEmail = email.replace(/ /g, '+');

    const user = await User.findOne({ email : processedEmail, key });

    if (!user) {
      console.log('Invalid verification link');
      return res.status(200).send('Invalid verification link');
    }

    user.verified = true;

    if (user.key) { 
      user.key = null;
    }

    await user.save();

    res.status(200).send('Email verified successfully!');
  } catch (error) {

    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
router.post('/api/login', async (req, res) => {

  try {

    console.log('Request to log in:', req.body);

    const { username, password } = req.body;
    const user = await User.findOne({ username, password });

    if (!user) {
      console.log("ERROR - Invalid credentials")
      return res.status(200).json({ status : 'ERROR', message : "Invalid credentials"});
    }
    else if (!user.verified) {
      console.log('User not verified');
      return res.status(200).json({ status : 'ERROR',  message : "User Not Verified" });
    }

    const sessionId = req.sessionID;

    user.loggedin = true;
    user.key = sessionId;

    await user.save();

    req.session.user = user;

    console.log('User logged in successfully:', user);
    res.status(200).json({status : 'ok'});
  } catch (error) {

    console.error('Error logging in:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout route
router.post('/api/logout', async (req, res) => {

  try {

    const user = await User.findOne({ key: req.sessionID });

    if (!user) {
      console.log('User not found');
      return res.status(200).json({ error: 'User not found' });
    }

    user.loggedin = false;
    user.key = null;
    await user.save();
    req.session.destroy(); 

    console.log('User logged out successfully:', user);
    res.status(200).json({status : 'ok'});
  } catch (error) {

    console.error('Error logging out:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User route
router.get('/api/user', async (req, res) => {

  try {

    const user = await User.findOne({ key: req.sessionID });
    
    if (!user) {
      console.log('User not found');
      return res.status(200).json({ loggedIn: false });
    }

    res.status(200).json({ loggedIn: user.loggedin, username: user.username });
  } catch (error) {
    
    console.error('Error fetching user information:', error.message);
    res.status(500).json({ status : "ERROR", message : 'Internal server error' });
  }
});


async function sendVerificationEmail(email, verificationKey) {
  // Create a Nodemailer transporter using SMTP
  const transporter = nodemailer.createTransport({
    host: 'localhost', // Use localhost for local SMTP server
    port: 1025, // Port used by SMTP server (default is 25)
    secure: false, // Use SSL (true) or not (false)
    tls: {
      rejectUnauthorized: false // Ignore SSL certificate errors
    }
  });

  // Construct the verification link
  const verificationLink = `http://localhost:8025/api/verify?email=${email}&key=${verificationKey}`;

  // Define email content
  const mailOptions = {
    from: 'no-reply@mapviewer.com', 
    to: email, // Recipient address
    subject: 'Account Verification', // Email subject
    text: `Please click on the following link to verify your email: ${verificationLink}`, // Plain text body
    html: `<p>Please click on the following link to verify your email: <a href="${verificationLink}">${verificationLink}</a></p>`, // HTML body
  };

  try {
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error; // Rethrow the error to handle it elsewhere
  }
}


module.exports = router;
