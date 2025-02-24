// Load configuration
require('dotenv').config();

const db = require('../config/dbService');

const LikeModel = {
  createLike: async (userId, memoryId) => {
    try {
      const dbResult = await db.query(
        `WITH deleted AS (
          DELETE FROM ${process.env.DB_TABLE_LIKES} 
          WHERE user_id = $1 AND memory_id = $2 
          RETURNING id
        )
        INSERT INTO ${process.env.DB_TABLE_LIKES} (user_id, memory_id, reaction) 
        SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT 1 FROM deleted) RETURNING id;`,
        [userId, memoryId, 'LIKE']
      )
  
      return {
        status: 'success',
        message: 'Like was recorded successfully'
      }
    }
    catch(error) {
      return {
        status: 'error',
        message: error.code === '23505' ? 'You are not allowed to like again what you already liked!' : 'Internal Server Error' 
      }
    }  
  },
  deleteLike: async () => {

  }
}

module.exports = LikeModel