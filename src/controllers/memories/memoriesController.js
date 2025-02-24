// Load configuration
require('dotenv').config();

// Load model(s)
const MemoryModel = require('../../models/MemoryModel')

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

const getMemoryFiguresByCountry = async (req, res, next) => {
  try {
    const memoryFiguresByCountry = await MemoryModel.getMemoryCountByCountry()
    res.status(200).json(memoryFiguresByCountry)
  }
  catch(error) {
    res.status(400).json(error)
  }
}

module.exports = {
  saveMemory: saveMemory,
  getLikesForMemory: getLikesForMemory,
  getAllMemories: getAllMemories,
  getMemoryFiguresByCountry: getMemoryFiguresByCountry
}