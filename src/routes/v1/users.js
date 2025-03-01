// Invoke config variables
require('dotenv').config();

const express = require('express');

// Controllers
const usersController = require('../../controllers/users/usersController')

// Middleware
const authMiddleware = require('../../middlewares/authMiddleware')

// Express router
const router = express.Router();

router.get('/', authMiddleware.authenticateJWT, authMiddleware.isUserAdmin, async (req, res, next) => {
  try {
    let usersList = await usersController.listUsers()
    if(usersList.status === "success") {
      res.status(200).json(usersList)
    }
  }
  catch(error) {
    res.status(400).json(error)
  }
})


router.delete('/:user_id', authMiddleware.authenticateJWT, async (req, res, next) => {
  try {
    let userDeletion = await usersController.deleteUser(req.params.user_id)
    if(userDeletion.status === "success") {
      // TODO - Also delete the images from S3
      res.status(200).json(userDeletion)
    }  
  }
  catch(error) {
    res.status(400).json(error)
  }
})

module.exports = router