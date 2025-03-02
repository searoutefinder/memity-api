// Invoke config variables
require('dotenv').config();

const express = require('express');

// Controllers
const memoriesController = require('../../controllers/memories/memoriesController')

// Load utils
const utils = require('../../util/utilities')

// Middleware
const authMiddleware = require('../../middlewares/authMiddleware')

// Express router
const router = express.Router();

router.delete('/:memory_id', authMiddleware.authenticateJWT, authMiddleware.isUserAdmin, memoriesController.deleteMemory)

module.exports = router