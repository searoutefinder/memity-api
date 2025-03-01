// Load configuration
require('dotenv').config();

// Load DB service
const db = require('../config/dbService');

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
  }
}

module.exports = UsersModel;