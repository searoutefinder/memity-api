// Invoke config variables
require('dotenv').config();

const express = require('express');

// Controllers
const usersController = require('../../controllers/users/usersController')

// Middleware
const authMiddleware = require('../../middlewares/authMiddleware')

// Express router
const router = express.Router();

router.get('/', authMiddleware.authenticateJWT, authMiddleware.isUserAdmin, usersController.listUsers)

module.exports = router