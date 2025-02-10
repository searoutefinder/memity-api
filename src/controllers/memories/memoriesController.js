// Load configuration
require('dotenv').config();

// Load services
const db = require('../../config/dbService');

const saveMemory = async(memoryObj) => {
  try{
    const result = await db.query(
      `INSERT INTO ${process.env.DB_TABLE_MEMORIES} (user_id, s3_url, s3_thumb_url, country_code) VALUES ($1, $2, $3, $4) RETURNING id`,
      [memoryObj.user_id, memoryObj.imageKey, memoryObj.thumbUrl, memoryObj.iso]
    )

    return {
      status: 'success',
      message: 'Image was inserted to DB successfully'
    }
  }
  catch(error) {
    console.log(error)
    return {
        status: 'error',
        message: error.code === '23505' ? 'You are not allowed to upload more than one image to the system!' : 'Internal Server Error' 
    }    
  } 
}

const getLikesForMemory = async (req, res, next) => {
  try {
    const dbResult = await db.query(
      `SELECT COUNT(*) AS memory_likes FROM ${process.env.DB_TABLE_LIKES} WHERE memory_id = $1`,
      [req.params.memoryId]
    ) 
      
    res.status(200).json({
      memoryId: req.params.memoryId,
      count: parseInt(dbResult[0].memory_likes),
      message: 'Likes were retrieved successfully'
    })
      
  }
  catch(error) {
    res.status(400).json({
      memoryId: req.params.memoryId,
      error: error.code === '22P02' ? 'Malformed input or the referenced memory doesn\'t exist' : 'Internal Server Error'
    })    
  }  
}

const getAllMemories = async (req, res, next) => {
  const { limit, offset } = req.pagination
  try{

    const { query, values } = req.query.country
    ? {
        query: `SELECT c.* FROM (SELECT a.*, CASE WHEN b.id IS NULL THEN FALSE ELSE TRUE END AS liked FROM 
      (SELECT ${process.env.DB_TABLE_MEMORIES}.*, COUNT(${process.env.DB_TABLE_LIKES}.id) AS likes FROM ${process.env.DB_TABLE_MEMORIES} 
      LEFT JOIN ${process.env.DB_TABLE_LIKES} ON ${process.env.DB_TABLE_LIKES}.memory_id = ${process.env.DB_TABLE_MEMORIES}.id
      GROUP BY ${process.env.DB_TABLE_MEMORIES}.id ORDER BY created_at DESC) a LEFT JOIN (SELECT * FROM ${process.env.DB_TABLE_LIKES} 
      WHERE user_id = $1) b ON a.id = b.memory_id) c WHERE country_code = $2 ORDER BY c.created_at DESC
	    LIMIT $3 OFFSET $4;`,
        values: [req.user.userId, req.query.country, limit, offset],
      }
    : {
        query: `SELECT a.*, CASE WHEN b.id IS NULL THEN FALSE ELSE TRUE END AS liked FROM 
        (SELECT ${process.env.DB_TABLE_MEMORIES}.*, COUNT(${process.env.DB_TABLE_LIKES}.id) AS likes FROM ${process.env.DB_TABLE_MEMORIES} 
        LEFT JOIN ${process.env.DB_TABLE_LIKES} ON ${process.env.DB_TABLE_LIKES}.memory_id = ${process.env.DB_TABLE_MEMORIES}.id
        GROUP BY ${process.env.DB_TABLE_MEMORIES}.id ORDER BY created_at DESC) a LEFT JOIN (SELECT * FROM ${process.env.DB_TABLE_LIKES} 
        WHERE user_id = $1) b ON a.id = b.memory_id ORDER BY a.created_at DESC LIMIT $2 OFFSET $3;`,
        values: [req.user.userId, limit, offset],
      };

    const dbResult = await db.query(query, values) 

    const result = dbResult.map((resultItem) => {
      return {
        ...{id: resultItem.id}, 
        ...{url: resultItem.s3_url}, 
        ...{thumb_url: resultItem.s3_thumb_url}, 
        ...{likes: parseInt(resultItem.likes)},
        ...{liked: resultItem.liked},
        ...{created_at: resultItem.created_at}
      }
    })
    
    res.status(200).json({
      offset: offset,
      next: offset + limit,
      memories: result,
      message: result.length > 0 ? 'Memories were retrieved successfully' : 'No memories are available. Start uploading one!'
    })    
  }
  catch(error) {
    console.log(error)
    res.status(400).json({
      error: 'Internal Server Error'
    }) 
  }
}

const getMemoryFiguresByCountry = async (req, res, next) => {
  try {
    const dbResult = await db.query(`SELECT c.code, c.country, COUNT(m.id) AS memories_count FROM ${process.env.DB_TABLE_COUNTRIES} c 
     LEFT JOIN ${process.env.DB_TABLE_MEMORIES} m ON c.code = m.country_code 
     GROUP BY c.code, c.country ORDER BY memories_count DESC;`)
    
    let response = {}

    dbResult.forEach(item => {      
      response[item.code] = `${item.country}\n(${item.memories_count})`
    })

    res.status(200).json({maplabels: response, message: 'Labels were retrieved successfully'})
  }
  catch(error) {
    console.log(error)
    res.status(400).json({
      error: 'Internal Server Error'
    }) 
  }
}

module.exports = {
  saveMemory: saveMemory,
  getLikesForMemory: getLikesForMemory,
  getAllMemories: getAllMemories,
  getMemoryFiguresByCountry: getMemoryFiguresByCountry
}