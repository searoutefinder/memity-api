// Load configuration
require('dotenv').config();

// Load services
const UsersModel = require('../../models/UsersModel')

const deleteUser = async (req, res, next) => {  
  try {
    const userDeleted = await UsersModel.deleteUser(req.params.user_id)
    if(userDeleted.status === "success") {
      res.status(200).json(userDeleted)
    } 
  }
  catch(error) {
    res.status(400).json(error)
  }
}

const listUsers = async (req, res, next) => {
  try {
    const usersList = await UsersModel.getUsers()
    if(usersList.status === "success") {
      res.status(200).json(usersList)
    }
  }
  catch(error) {
    res.status(400).json(error)
  }
}

module.exports = {
  listUsers: listUsers,
  deleteUser: deleteUser
}