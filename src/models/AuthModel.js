// Load configuration
require('dotenv').config();

// Load DB service
const db = require('../services/dbService');

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
      return {
        status: 'success',
        data: user[0]
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
  updateUserPassword: async (hashedPassword, userId) => {
    try {
      const passwordUpdate = await db.query(`UPDATE ${process.env.DB_TABLE_USERS} SET password_hash = $1 WHERE id = $2`, 
        [hashedPassword, userId])

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
  },

}

module.exports = AuthModel;