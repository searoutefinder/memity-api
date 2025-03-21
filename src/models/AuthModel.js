// Load configuration
require('dotenv').config();

// Load DB service
const db = require('../services/dbService');
const utilities = require('../util/utilities')

const AuthModel = {
  createUser: async (email, hashedPassword, verificationToken) => {
    const createdUser = await db.query(
      `INSERT INTO ${process.env.DB_TABLE_USERS} (email, password_hash, is_verified, verification_token) VALUES ($1, $2, $3, $4) RETURNING id, email`,
      [email, hashedPassword, false, verificationToken]
    )
    return createdUser[0]
  },
  getVerifiedUserById: async (userId) => {
    try {
      const user = await db.query(`SELECT * FROM ${process.env.DB_TABLE_USERS} WHERE is_verified = TRUE AND id = $1 LIMIT 1`, [userId])
      if(user.length > 0) {
        return {
          status: 'success',
          data: user[0]
        }
      }
      else
      {
        return {
          status: 'not_found',
          data: []
        }
      }
    }
    catch(error) {
      return {
        status: 'error',
        data: []
      }
    }
  },
  getUserByEmail: async (email) => {
    try {
      const user = await db.query(`SELECT id, email, password_hash, is_verified, user_role FROM ${process.env.DB_TABLE_USERS} WHERE email = $1`, [email]);

      if(user.length > 0) {
        return {
          status: 'success',
          data: user[0]
        }
      }
      else
      {
        return {
          status: 'warning',
          data: []
        }
      }
    }
    catch(error) {
      console.log(error)
      return {
        status: 'error',
        data: []
      }      
    }
  },
  verifyUserById: async (userId) => {
    try {
      const userVerification = await db.query(`UPDATE ${process.env.DB_TABLE_USERS} SET is_verified = TRUE WHERE id = $1 RETURNING *`, [userId]);
      return {
        status: 'success',
        data: {
          id: userVerification[0].id,
          email: userVerification[0].email
        }
      }
    }
    catch(error) {
      return {
        status: 'error',
        data: []
      }
    }
    
  },
  generatePasswordResetToken: async(userId) => {
    const resetPasswordToken = utilities.generateResetToken()

    try {
      const resetTokenGeneration = await db.query(`UPDATE ${process.env.DB_TABLE_USERS} SET password_reset_token = $1,
        password_reset_expires_at = NOW() + INTERVAL '1 HOUR' WHERE id = $2 RETURNING password_reset_token`, 
        [resetPasswordToken, userId])

      return {
        status: 'success',
        message: 'Reset token generated successfully!',
        data: resetTokenGeneration[0]
      }    
    }
    catch(error) {
      return {
        status: 'error',
        message: 'Internal Server Error',
        data: []
      }
    }
  },
  getUserByResetToken: async(token) => {
    try {
      const user = await db.query(`SELECT id FROM ${process.env.DB_TABLE_USERS} WHERE password_reset_token = $1 AND password_reset_expires_at > NOW()`, [token])
      
      return {
        status: 'success',
        message: 'User successfully retrieved!',
        data: user[0]
      }       
    }
    catch(error) {
      return {
        status: 'error',
        message: 'Internal Server Error',
        data: []
      }
    }
  },
  resetPasswordResetToken: async(userId) => {
    try {
      const tokenReset = await db.query(`UPDATE ${process.env.DB_TABLE_USERS} SET password_reset_token = NULL,
        password_reset_expires_at = NULL WHERE id = $1`, 
        [userId])

      return {
        status: 'success',
        message: 'Reset token was successfully reset!',
        data: []
      }    
    }
    catch(error) {
      return {
        status: 'error',
        message: 'Internal Server Error',
        data: []
      }
    }
  },
  validatePasswordResetToken: async(resetToken) => {
    try {
      const isTokenValid = await db.query(`SELECT * FROM ${process.env.DB_TABLE_USERS} WHERE password_reset_token = $1
        AND password_reset_expires_at > NOW();`, 
        [resetToken])

      return {
        status: 'success',
        message: 'Reset token is valid!',
        data: []
      }    
    }
    catch(error) {
      return {
        status: 'error',
        message: 'Internal Server Error',
        data: []
      }
    }
  },  
  updateUserPassword: async (hashedPassword, token) => {
    try {
      const passwordUpdate = await db.query(`UPDATE ${process.env.DB_TABLE_USERS} SET password_hash = $1, updated_at = NOW() WHERE password_reset_token = $2`, 
        [hashedPassword, token])

      return {
        status: 'success',
        message: 'Password updated successfully!',
        data: []
      }
    }
    catch(error) {
      return {
        status: 'error',
        message: 'Internal Server Error',
        data: []
      }
    }
  }

}

module.exports = AuthModel;