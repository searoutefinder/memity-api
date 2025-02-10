// Load configuration
require('dotenv').config();

// Load dependencies
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/dbService');
const emailService = require('../services/emailService');

const register = async (req, res) => {
  const { email, password } = req.body
  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS))

  try {

    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' })

    const result = await db.query(
      `INSERT INTO ${process.env.DB_TABLE_USERS} (email, password_hash, is_verified, verification_token) VALUES ($1, $2, $3, $4) RETURNING id, email`,
      [email, hashedPassword, false, verificationToken]
    )

    const user = result[0]
    const token = jwt.sign({ userId: user.id}, process.env.JWT_SECRET, { expiresIn: '1d' })

    await emailService.sendVerificationEmail(user.email, token)
    
    res.status(201).json({ message: 'User registered, verify your email' })
  } 
  catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.code === '23505' ? 'A user with this email already exists!' : 'Other error' })
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
  
    const usersWithId = await db.query(`SELECT * FROM ${process.env.DB_TABLE_USERS} WHERE is_verified = TRUE AND id = $1`, [userId]);
    const isAlreadyVerified = usersWithId.length > 0 ? true : false
  
    if(isAlreadyVerified) {
      // User has already been verified  
      throw new Error()
    }
  
    // Update user as verified
    await db.query(`UPDATE ${process.env.DB_TABLE_USERS} SET is_verified = TRUE WHERE id = $1`, [userId]);
    
    res.status(200).json({ status: 200, message: 'Email verified successfully. You can now log in.' });
    
  } catch (error) {
    res.status(400).json({ status: 400, message: 'Invalid or expired verification link' });
  }
}
  
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.SALT_ROUNDS));
    
      await db.query(`UPDATE ${process.env.DB_TABLE_USERS} SET password_hash = $1 WHERE id = $2`, [hashedPassword, decoded.userId]);
    
      res.status(200).json({ status: 200, message: 'Password successfully reset' });
    
    } catch (error) {
      res.status(400).json({ status: 400, message: 'Invalid or expired token' });
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Check if user exists
      const user = await db.query(`SELECT id, email, password_hash, is_verified FROM ${process.env.DB_TABLE_USERS} WHERE email = $1`, [email]);

      if (user.length === 0) {
        return res.status(401).json({ status: 401, message: 'Invalid email or password' });
      }
  
      const { id, password_hash, is_verified } = user[0];

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
      const token = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '1d' });

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
  
    } catch (error) {
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
