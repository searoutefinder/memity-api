// Load configuration
require('dotenv').config();

// Load model(s)
const MemoryModel = require('../../models/MemoryModel')

// Load utils
const utils = require('../../util/utilities')

const saveMemory = async(memoryObj) => {
  try{
    const memoryInsertion = await MemoryModel.createMemory(memoryObj)
    return memoryInsertion
  }
  catch(error) {
    res.status(400).json(error)   
  } 
}

const getLikesForMemory = async (req, res, next) => {
  try {
    const retrievedLikes = await MemoryModel.getLikesCount(req.params.memoryId)
    res.status(200).json(retrievedLikes)
  }
  catch(error) {
    res.status(400).json(error)
  }  
}

const getAllMemories = async (req, res, next) => {
  try{
    const allMemories = await MemoryModel.getAllMemories(req.pagination, req.query, req.user)   
    res.status(200).json(allMemories)
  }
  catch(error) {
    res.status(400).json(error)
  }
}

const getMemoriesForUser = async (req, res, next) => {
  try {
    const memoryList = await MemoryModel.getMemoryForUser(req.params.user_id)
    res.status(200).json(memoryList)
  }
  catch(error) {
    res.status(400).json({
      status: 'error',
      message: error
    })
  }
}

const getMemoryFiguresByCountry = async (req, res, next) => {
  try {
    const memoryFiguresByCountry = await MemoryModel.getMemoryCountByCountry()
    res.status(200).json(memoryFiguresByCountry)
  }
  catch(error) {
    res.status(400).json(error)
  }
}

const deleteMemory = async (req, res, next) => {
  try{
    const memoryDeletion = await MemoryModel.deleteMemory(req.params.memory_id)   
    const s3Deleted = await utils.deleteS3ImageByURL(memoryDeletion.data.s3_url)
    
    if(memoryDeletion.status === "success" && s3Deleted.success === true) {
      res.status(200).json(memoryDeletion)
    }
    else
    {
      res.status(400).json({
        status: 'error',
        message: 'Internal Server Error'
      })      
    }
  }
  catch(error) {
    console.log(error)
    res.status(400).json(error)
  }
}

module.exports = {
  saveMemory: saveMemory,
  getLikesForMemory: getLikesForMemory,
  getAllMemories: getAllMemories,
  getMemoryFiguresByCountry: getMemoryFiguresByCountry,
  getMemoriesForUser: getMemoriesForUser,
  deleteMemory: deleteMemory
}