// Load configuration
require('dotenv').config();

// Load dependencies
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token; // Accessing the token from cookies
  
  if (!token) {
    return res.status(401).json({status: 401, message: 'You are not authorized to use this resource!'}); // No token found
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({status: 403, message: 'Token verification failed'}); // Token verification failed
    }
  
    req.user = user; // Attach user info to request object
    next(); // Proceed to the next middleware or route handler
  });
}

const isUserAdmin = (req, res, next) => {
  if(typeof req.user !== 'undefined' && typeof req.user.userRole !== 'undefined') {
    if(req.user.userRole === process.env.ADMIN_ROLE_NAME) {
      next()
    }
    else
    {
      return res.status(401).json({status: 401, message: 'Your role is not granted permission to use this resource!'});
    }    
  }
  else
  {
    return res.status(401).json({status: 401, message: 'Your role is not granted permission to use this resource!'});
  }
}

const requestPasswordReset = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await db.query(`SELECT id FROM ${process.env.DB_TABLE_USERS} WHERE email = $1`, [email])

      if (!user.length) {
        return res.status(404).json({ message: 'User not found' })
      }
  
      const token = jwt.sign({ userId: user[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' })
  
      await emailService.sendPasswordResetEmail(email, token)

      res.json({ message: 'Password reset link sent to your email' })
  
    } catch (error) {
      res.status(500).json({ message: 'Error sending password reset email' })
    }
}

module.exports = {
  requestPasswordReset: requestPasswordReset,
  authenticateJWT: authenticateJWT,
  isUserAdmin: isUserAdmin
}
