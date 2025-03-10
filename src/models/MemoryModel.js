// Load configuration
require('dotenv').config();

const db = require('../services/dbService');

const MemoryModel = {
    createMemory: async (memoryObj) => {
      try {
        const result = await db.query(
          `INSERT INTO ${process.env.DB_TABLE_MEMORIES} (user_id, s3_url, s3_thumb_url, country_code) VALUES ($1, $2, $3, $4) RETURNING id`,
          [
            memoryObj.user_id, 
            memoryObj.imageKey, 
            memoryObj.thumbUrl, 
            memoryObj.iso
          ]
        )

        return {
          status: 'success',
          message: 'Image was inserted to DB successfully',
          data: []
        }

      } catch (error) {
        return {
          status: 'error',
          message: error,
          data: []
        }
      }
    },
    getLikesCount : async (memoryId) => {
      try {
        const dbResult = await db.query(
          `SELECT COUNT(*) AS memory_likes FROM ${process.env.DB_TABLE_LIKES} WHERE memory_id = $1`,
          [memoryId]
        )

        return {
          memoryId: memoryId,
          count: parseInt(dbResult[0].memory_likes),
          message: 'Likes were retrieved successfully'
        }
      }
      catch(error) {
        return {
          memoryId: memoryId,
          error: error.code === '22P02' ? 'Malformed input or the referenced memory doesn\'t exist' : 'Internal Server Error'
        }
      }         
    },
    getAllMemories: async (pagination, queryString, user) => {
      try {
        const { limit, offset } = pagination
        const { query, values } = queryString
          ? {
            query: `SELECT c.* FROM (SELECT a.*, CASE WHEN b.id IS NULL THEN FALSE ELSE TRUE END AS liked FROM 
            (SELECT ${process.env.DB_TABLE_MEMORIES}.*, COUNT(${process.env.DB_TABLE_LIKES}.id) AS likes FROM ${process.env.DB_TABLE_MEMORIES} 
            LEFT JOIN ${process.env.DB_TABLE_LIKES} ON ${process.env.DB_TABLE_LIKES}.memory_id = ${process.env.DB_TABLE_MEMORIES}.id
            GROUP BY ${process.env.DB_TABLE_MEMORIES}.id ORDER BY created_at DESC) a LEFT JOIN (SELECT * FROM ${process.env.DB_TABLE_LIKES} 
            WHERE user_id = $1) b ON a.id = b.memory_id) c WHERE country_code = $2 ORDER BY c.likes DESC
            LIMIT $3 OFFSET $4;`,
            values: [user.userId, queryString.country, limit, offset]
            }
          : {
            query: `SELECT a.*, CASE WHEN b.id IS NULL THEN FALSE ELSE TRUE END AS liked FROM 
            (SELECT ${process.env.DB_TABLE_MEMORIES}.*, COUNT(${process.env.DB_TABLE_LIKES}.id) AS likes FROM ${process.env.DB_TABLE_MEMORIES} 
            LEFT JOIN ${process.env.DB_TABLE_LIKES} ON ${process.env.DB_TABLE_LIKES}.memory_id = ${process.env.DB_TABLE_MEMORIES}.id
            GROUP BY ${process.env.DB_TABLE_MEMORIES}.id ORDER BY created_at DESC) a LEFT JOIN (SELECT * FROM ${process.env.DB_TABLE_LIKES} 
            WHERE user_id = $1) b ON a.id = b.memory_id ORDER BY a.created_at DESC LIMIT $2 OFFSET $3;`,
            values: [user.userId, limit, offset],
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
        
        return {
          offset: offset,
          next: offset + limit,
          memories: result,
          message: result.length > 0 ? 'Memories were retrieved successfully' : 'No memories are available. Start uploading one!'
        }  
      } 
      catch(error) {
        return({error: 'Internal Server Error'})
      }      

    },
    getMemoryCountByCountry: async() => {
      try {
        const dbResult = await db.query(`SELECT c.code, c.country, COUNT(m.id) AS memories_count FROM ${process.env.DB_TABLE_COUNTRIES} c 
        LEFT JOIN ${process.env.DB_TABLE_MEMORIES} m ON c.code = m.country_code GROUP BY c.code, c.country ORDER BY memories_count DESC;`)
           
        let response = {}
       
        dbResult.forEach(item => {      
          response[item.code] = `${item.country}\n(${item.memories_count})`
        })

        return {
          maplabels: response,
          message: 'Labels were retrieved successfully'
        }
      }
      catch(error) {
        console.log(error)
        return {error: 'Internal Server Error'}
      }        
    },
    getMemoryForUser: async (user_id) => {
      try {
        const dbResult = await db.query(
          `SELECT id, user_id, s3_url, s3_thumb_url FROM ${process.env.DB_TABLE_MEMORIES} WHERE user_id = $1`,
          [user_id]
        )

        if(dbResult.length > 0) {
          return {
            status: 'success',
            data: dbResult,
            message: 'Memities retrieved successfully!'
          }
        }
        else
        {
          return {
            status: 'success',
            data: [],
            message: 'No memities were retrieved!'
          }
        }
      }
      catch(error) {
        return {
          status: 'error',
          message: error.code === '22P02' ? 'Malformed input or the referenced memory doesn\'t exist' : 'Internal Server Error',
          data: []
        }
      }
    },
    deleteMemory: async (memoryId) => {
      try {
        const dbResult = await db.query(
          `DELETE FROM ${process.env.DB_TABLE_MEMORIES} WHERE id = $1 RETURNING *`,
          [memoryId]
        )

        return {
          status: 'success',
          message: 'Memity was deleted successfully!',
          data: dbResult[0]
        }
      }
      catch(error) {
        return {
          error: error.code === '22P02' ? 'Malformed input or the referenced memory doesn\'t exist' : 'Internal Server Error'
        }
      }
    }
};

module.exports = MemoryModel;
