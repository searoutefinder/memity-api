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
      status: 'error',
      message: error.code === '23505' ? 'A user with this email already exists!' : 'Internal Error', 
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
      return res.redirect(`${process.env.CLIENT_APP_URL}/auth?mode=email-verified&status=success`)
    }
    else
    {
      return res.redirect(`${process.env.CLIENT_APP_URL}/auth?mode=email-verified&status=error`)
    }    
  }
  catch(error) {
    res.status(400).json({
      status: 400,
      message: 'Invalid or expired verification link'
    });
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

    // Production
    if(process.env.NODE_ENV === 'production') {
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/',
        maxAge: 86400000,
        domain: '.memity.io'
      });
    }
    else if(process.env.NODE_ENV === 'development')
    {
      // Development
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/',
        maxAge: 86400000
      }); 
    }   

    // Return login status
    res.status(200).json({ status: 200, message: 'Login successful' });  
  }
  catch(error) {
    console.log(error)
    res.status(500).json({ status: 500, message: 'Internal server error' });
  }
}

const logout = async (req, res) => {

  // Production
  if(process.env.NODE_ENV === 'production') {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/',
      maxAge: 86400000,
      domain: '.memity.io'
    });
  }
  else if(process.env.NODE_ENV === 'development')
  {
    // Development
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/'
    }); 
  }
    
  return res.status(200).json({ status: 200, message: 'Logged out successfully' });
}

const requestPasswordReset = async (req, res) => {
  
  const { email } = req.body;

  try {
    // Get user by his email
    const user = await AuthModel.getUserByEmail(email);
    
    // Return if there are no users returned
    if(user.data.length === 0) {
      return res.status(401).json({ status: 'warning', message: 'User not found' });
    }

    // Create a reset token and store it in the DB
    const resetToken = await AuthModel.generatePasswordResetToken(user.data.id);

    // Send out an email containing the password reset link
    await emailService.sendPasswordResetEmail(user.data.email, resetToken.data.password_reset_token)

    res.status(200).json({ status: 'success', message: 'Password reset email sent' });
  }
  catch(error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  
  try {

    // Hash incoming password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));

    // Get user by token
    const userRequest = await AuthModel.getUserByResetToken(token)

    // Retrun immediately if there is no user returned or if there is an error
    if(userRequest.status !== 'success') {
      return res.status(400).json({
        status: 400,
        message: 'There was a problem while we tried to reset your password!'
      });
    }

    if(typeof userRequest.data === 'undefined') {
      return res.status(400).json({
        status: 400,
        message: 'User can not be identified or token has expired!'
      });
    }    

    console.log(userRequest)

    // Update password using the token and the the hashed password
    const passwordUpdate = await AuthModel.updateUserPassword(hashedPassword, token);

    // set back the reset token and the expiration fields to default
    const completedTokenReset = await AuthModel.resetPasswordResetToken(userRequest.data.id)

    
    return res.status(passwordUpdate.status === 'success' ? 200 : 400).json({ status: passwordUpdate.status, message: passwordUpdate.message });
    
  }
  catch(error) {
    console.log(error)
    res.status(400).json({
      status: 400,
      message: error.message
    });    
  }
  /*
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
  */
}

module.exports = {
  register: register,
  login: login,
  logout: logout,
  verifyEmail: verifyEmail,
  resetPassword: resetPassword,
  requestPasswordReset: requestPasswordReset
}
