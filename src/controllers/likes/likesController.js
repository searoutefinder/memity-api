// Load configuration
require('dotenv').config()

// Load services
const db = require('../../config/dbService')

const getLikes = async (req, res, next) => {
  
}

const createLike = async (req, res, next) => {
  try {

    const dbResult = await db.query(
      `WITH deleted AS (
        DELETE FROM ${process.env.DB_TABLE_LIKES} 
        WHERE user_id = $1 AND memory_id = $2 
        RETURNING id
      )
      INSERT INTO ${process.env.DB_TABLE_LIKES} (user_id, memory_id, reaction) 
      SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT 1 FROM deleted) RETURNING id;`,
      [req.user.userId, req.params.memoryId, 'LIKE']
    )

    res.status(200).json({
      status: 'success',
      message: 'Like was recorded successfully'
    })

  }
  catch(error) {
    //console.log(error)
    res.status(400).json({
      status: 'error',
      message: error.code === '23505' ? 'You are not allowed to like again what you already liked!' : 'Internal Server Error' 
    })    
  }
}

const deleteLike = async (req, res, next) => {
  
}

module.exports = {
  createLike: createLike,
  getLikes: getLikes,
  deleteLike: deleteLike
}