// Load configuration
require('dotenv').config()

// Load model(s)
const LikeModel = require('../../models/LikeModel')

const getLikes = async (req, res, next) => {
  
}

const createLike = async (req, res, next) => {
  try {

    const likeCreationResult = await LikeModel.createLike(req.user.userId, req.params.memoryId)

    res.status(200).json(likeCreationResult)

  }
  catch(error) {
    console.log(error)
    res.status(400).json(error)    
  }
}

const deleteLike = async (req, res, next) => {
  
}

module.exports = {
  createLike: createLike,
  getLikes: getLikes,
  deleteLike: deleteLike
}