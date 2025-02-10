// Invoke config variables
require('dotenv').config();

// Invoke dependencies
const express = require('express');

// Invoke middleware functions
const authMiddleware = require('../../middlewares/authMiddleware')

// Invoke controllers
const memoriesController = require('../../controllers/memories/memoriesController')
const likesController = require('../../controllers/likes/likesController')

// Invoke utilities
const utilities = require('../../util/utilities')

const router = express.Router()

router.get('/:memoryId', () => {
  // Get all likes for a memory
  // SELECT COUNT(*) FROM memity_likes WHERE memory_id = req.params.memoryId AND reaction = 'like';
})
router.post('/:memoryId', authMiddleware.authenticateJWT, likesController.createLike)

router.delete('/:memoryId', async () => {
  // Delete a like record
  // DELETE FROM memity_likes WHERE user_id = req.user.userId AND memory_id = req.params.memoryId AND reaction = 'LIKE';    
})

module.exports = router;