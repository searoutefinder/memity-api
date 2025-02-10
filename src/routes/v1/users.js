// Invoke config variables
require('dotenv').config();

const express = require('express');
const { query } = require('../../services/dbService')
const bcrypt = require('bcrypt')
const crypto = require('crypto')

const authMiddleware = require('../../middlewares/authMiddleware')

const router = express.Router();

router.get('/', authMiddleware.authenticateJWT, async (req, res, next) => {
  const users = await query(`SELECT * FROM memity_memories WHERE user_id = $1;`, [req.user.userId])
  
  console.log(users)
})

// GET - /users Load single user from server by its user_id
router.get('/:id', (req, res, next) => {

}) 

module.exports = router