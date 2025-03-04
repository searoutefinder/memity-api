// Load configuration
require('dotenv').config();

// Load dependencies
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load services
const emailService = require('../services/emailService');

// Load models
const AuthModel = require('../models/AuthModel')

const register = async (req, res) => {
  const { email, password } = req.body
  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS))

  try {
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' })
    const user = await AuthModel.createUser(email, hashedPassword, verificationToken)
    const token = jwt.sign({ userId: user.id}, process.env.JWT_SECRET, { expiresIn: '1d' })
    await emailService.sendVerificationEmail(user.email, token)
    res.status(201).json({ status: 'success', message: 'User registered, verify your email', data: []})
  }
  catch(error) {
    res.status(500).json({
      message: 'Error registering user', 
      error: error.code === '23505' ? 'A user with this email already exists!' : 'Internal Error'
    })
  }
}

const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const expiryDate = decoded.exp
    const currentDate = Math.floor(Date.now() / 1000)
  
    if(expiryDate < currentDate) {
      // Token has expired
      throw new Error()
    }
    
    // Check if the user is already verified
    const user = await AuthModel.getVerifiedUserById(userId)
    if(user.status === 'success') {
      throw new Error()
    }

    // If the user is not yet verified, verify him
    const verification = await AuthModel.verifyUserById(userId)
    if(verification.status === 'success') {
      res.status(200).json({ status: 200, message: 'Email verified successfully. You can now log in.' });
    }
    else
    {
      res.status(400).json({ status: 400, message: 'There has been a problem during email verification!' });
    }    
  }
  catch(error) {
    res.status(400).json({
      status: 400,
      message: 'Invalid or expired verification link'
    });
  }
}

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.SALT_ROUNDS));
  
    const pwUpdate = await AuthModel.updateUserPassword(hashedPassword, decoded.userId)
  
    if(pwUpdate.status === 'success') {
      res.status(200).json({
        status: 200,
        message: 'Password successfully reset'
      });
    }
    else
    {
      res.status(400).json({
        status: 400,
        message: 'There was a problem while we tried to update your password!'
      });
    }
  } catch (error) {
    res.status(400).json({ status: 400, message: 'Invalid or expired token' });
  }
}

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await AuthModel.getUserByEmail(email)
    
    if (Object.keys(user.data).length === 0) {
      return res.status(401).json({status: 401, message: 'Invalid email or password' });
    }

    const { id, email: userEmail, password_hash, is_verified, user_role } = user.data;  
  
    // Check if the user verified their email
    if (!is_verified) {
      return res.status(403).json({ status: 403, message: 'Please verify your email before logging in' });
    } 
  
    // See if passwords match
    const isMatch = await bcrypt.compare(password, password_hash);

    if (!isMatch) {
      return res.status(401).json({ status: 401, message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: id, userRole: user_role, userEmail: userEmail }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
    // Set up cookie to to store the new JWT token
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None', // or Lax
      path: '/',
      maxAge: 86400000, // 24 hour
    });

    // Return login status
    res.status(200).json({ status: 200, message: 'Login successful' });  
  }
  catch(error) {
    console.log(error)
    res.status(500).json({ status: 500, message: 'Internal server error' });
  }
}

const logout = async (req, res) => {

  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
  });
    
  return res.status(200).json({ status: 200, message: 'Logged out successfully' });
}

module.exports = {
  register: register,
  login: login,
  logout: logout,
  verifyEmail: verifyEmail,
  resetPassword: resetPassword
}
