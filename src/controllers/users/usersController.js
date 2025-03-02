// Load configuration
require('dotenv').config();

// Load services
const db = require('../../config/dbService');
const UsersModel = require('../../models/UsersModel')
const MemoryModel = require('../../models/MemoryModel')

// Load utils
const utils = require('../../util/utilities')

const canUserSave = async (user_id) => {
  try{
    const canUserSave = await UsersModel.canUserSave(user_id)  
    return canUserSave
    }
    catch(error) {
      console.log(error)
      return false  
  }
}

const deleteUser = async (req, res, next) => {  

  try {

    // Return if the admin tries to delete himself
    if(req.user.userId === req.params.user_id) {
      res.status(400).json({
        status: "error",
        message: "This operation is not possible."
      })

      return
    }

    const memoryDetails = await MemoryModel.getMemoryForUser(req.params.user_id)
    
    // Delete only the user record in case it doesn't have memories associated with it
    if(memoryDetails.data.length === 0) {
      const userDeleted = await UsersModel.deleteUser(req.params.user_id)
      if(userDeleted.status === "success") {
        res.status(200).json(userDeleted)
      }
      else
      {
        res.status(400).json({
          status: 'error',
          message: 'Internal Server Error'
        })
      }      
    }
    else
    {
      // If the user has memories, also clear them from S3
      const s3Deleted = await utils.deleteS3ImageByURL(memoryDetails.data[0].s3_url)        
      const userDeleted = await UsersModel.deleteUser(req.params.user_id)
    
      if(userDeleted.status === "success" && s3Deleted.success === true) {
        res.status(200).json(userDeleted)
      }
      else
      {
        res.status(400).json({
          status: 'error',
          message: 'Internal Server Error'
        })
      }       
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

const listUserSuggestions = async (req, res, next) => {
  try {
    if(typeof req.query.q === 'undefined' || req.query.q === '') {
      res.status(400).json({status: 'error', message: 'You must supply a search term!', data: []})
      return
    }
    const suggestions = await UsersModel.getUserSuggestions(req.query.q)
    if(suggestions.status === "success") {
      res.status(200).json(suggestions)
    }    
  }
  catch(error) {
    res.status(400).json(error)
  }
}

module.exports = {
  listUsers: listUsers,
  deleteUser: deleteUser,
  canUserSave: canUserSave,
  listUserSuggestions: listUserSuggestions
}