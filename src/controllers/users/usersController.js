// Load configuration
require('dotenv').config();

// Load services
const db = require('../../config/dbService');
const UsersModel = require('../../models/UsersModel')

const canUserSave = async (user_id) => {
    try{
        const result = await db.query(
          `SELECT COUNT(*) AS img_cnt FROM ${process.env.DB_TABLE_MEMORIES} WHERE user_id = $1`,
          [user_id]
        )
    
        return result[0].img_cnt > 0 ? false : true
      }
      catch(error) {
        console.log(error)
        return false  
      }
}

const deleteUser = async (user_id) => {
  try {
    const userDeleted = await UsersModel.deleteUser(user_id)
    return userDeleted
  }
  catch(error) {
    return error
  }
}

const listUsers = async () => {
  try {
    const usersList = await UsersModel.getUsers()
    return usersList
  }
  catch(error) {
    return error
  }
}

module.exports = {
  canUserSave: canUserSave,
  listUsers: listUsers,
  deleteUser: deleteUser
}