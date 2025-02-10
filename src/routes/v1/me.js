// Invoke config variables
require('dotenv').config();

const express = require('express');
const { query } = require('../../services/dbService')
const bcrypt = require('bcrypt')
const crypto = require('crypto')

const authMiddleware = require('../../middlewares/authMiddleware')

const router = express.Router();

router.get('/', authMiddleware.authenticateJWT, async (req, res, next) => {
  try {

    const users = await query(`SELECT CASE WHEN (SELECT COUNT(*) AS memories_count FROM ${process.env.DB_TABLE_MEMORIES}
      WHERE user_id = $1) = 0 THEN FALSE ELSE TRUE END AS quota_reached, memity_users.email
      FROM ${process.env.DB_TABLE_USERS} WHERE id = $2`, [req.user.userId, req.user.userId])

    res.status(200).json({
      status: 'success',
      message: 'User data was retrieved successfully',
      user: {
        quotaReached: users[0].quota_reached || false,
        email: users[0].email
      }
    })

  } catch(error) {
    console.log(error)
    res.status(500).json({message: 'Internal Server Error'})
  }
})

module.exports = router