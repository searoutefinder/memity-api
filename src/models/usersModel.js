// Load configuration
require('dotenv').config();

// Load DB service
const db = require('../services/dbService');

const UsersModel = {
  getUsers: async () => {
    try {
      const result = await db.query(`SELECT id, email FROM ${process.env.DB_TABLE_USERS} WHERE user_role = 'USER'`, [])
      return {
        status: 'success',
        message: 'List of users were retrieved successfully',
        data: result
      }       
    }
    catch(error) {
      return {
        status: 'error',
        message: error,
        data: []
      }
    }
  },
  getUserSuggestions: async (term) => {
    try {
        const result = await db.query(`SELECT id, email FROM ${process.env.DB_TABLE_USERS} WHERE email ILIKE $1 LIMIT 5`, [`%${term}%`])
        return {
          status: 'success',
          message: 'Suggestions were retrieved successfully',
          data: result
        }       
      }
      catch(error) {
        return {
          status: 'error',
          message: error,
          data: []
        }
      }    
  },
  deleteUser: async (user_id) => {
    try {
      const result = await db.query(`DELETE FROM ${process.env.DB_TABLE_USERS} WHERE id = $1`, [user_id])
      return {
        status: 'success',
        message: 'User was deleted successfully',
        data: []
      }      
    }
    catch(error) {
      return {
        status: 'error',
        message: error,
        data: []
      }
    }
  },
  canUserSave: async (user_id) => {
    try {
      const result = await db.query(`SELECT COUNT(*) AS img_cnt FROM ${process.env.DB_TABLE_MEMORIES} WHERE user_id = $1`, [user_id])
      return result[0].img_cnt > 0 ? false : true
    }
    catch(error) {
      return false
    }
  }
}

module.exports = UsersModel;