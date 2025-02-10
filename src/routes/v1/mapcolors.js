// Invoke config variables
require('dotenv').config();

// Invoke dependencies
const express = require('express');
const multer = require('multer');

// Invoke middleware functions
const authMiddleware = require('../../middlewares/authMiddleware')

// Invoke controllers
const memoriesController = require('../../controllers/memories/memoriesController')

const router = express.Router();

// Get all map labels with their country's like figures
router.get('/', memoriesController.getMemoryFiguresByCountry)


module.exports = router;