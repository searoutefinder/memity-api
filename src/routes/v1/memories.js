// Invoke config variables
require('dotenv').config();

// Invoke dependencies
const express = require('express');
const multer = require('multer');

// Invoke middleware functions
const authMiddleware = require('../../middlewares/authMiddleware')
const s3UploadMiddleware = require('../../middlewares/s3UploadMiddleware')
const s3ModerateMiddleware = require('../../middlewares/s3ModerateMiddleware')
const detectCountryMiddleware = require('../../middlewares/detectCountryMiddleware')
const validateMemoryIdMiddleware = require('../../middlewares/validateMemoryId')
const validatePaginationMiddleware = require('../../middlewares/validatePagination')

// Invoke controllers
const memoriesController = require('../../controllers/memories/memoriesController')
const usersController = require('../../controllers/users/usersController')

// Invoke utilities
const utilities = require('../../util/utilities')
const geolocatorUtils = require('../../util/ip_geolocator')

const router = express.Router();

/**
 * 
 * POST /memories Upload a new memory (image) to the system
 * 
 */
router.post(
  '/',
  authMiddleware.authenticateJWT,
  async (req, res, next) => {
    const canUserSave = await usersController.canUserSave(req.user.userId)
    if(canUserSave) {
      next()
    }
    else
    {
      res.status(200).json({status: 200, message: 'You are not allowed to  upload more than one picture to the system!'})
    }
  },
  s3UploadMiddleware.storageBasedUpload,
  s3UploadMiddleware.checkFileSize,
  s3UploadMiddleware.checkMagicBytes,
  s3UploadMiddleware.createFilename,
  s3UploadMiddleware.upload,
  s3UploadMiddleware.uploadThumbnail, 
  detectCountryMiddleware.detectIPandCountry, 
  s3ModerateMiddleware.moderate,   
  async (req, res, next) => {

    const memoryObj = {
      ...req.moderationStatus,
      ...{
        thumbUrl: req.s3ThumbUrl
      },
      ...{
        ip: req.userIP,
        iso: req.userCountry
      },
      ...{user_id: req.user.userId}
    }

    //console.log(geolocatorUtils.getClientIp())

    //console.log(memoryObj)

    if(memoryObj.isSafe) {

      const saveResponse = await memoriesController.saveMemory(memoryObj)

      if(saveResponse.status === "success") {
        res.status(201).json({status: 201, message: saveResponse.message})
      }
      else
      {
        res.status(500).json({status: 400, message: saveResponse.message})
      }
    }
  }
);

// Get likes count on a single memory
router.get('/:memoryId/likes', validateMemoryIdMiddleware.validateMemoryId, memoriesController.getLikesForMemory)

// Get memories for a selected user
router.get('/:user_id', authMiddleware.authenticateJWT, authMiddleware.isUserAdmin, memoriesController.getMemoriesForUser)

//Get all memories, sorted by created_at in a descending order
router.get('/', authMiddleware.authenticateJWT, validatePaginationMiddleware.validatePagination, memoriesController.getAllMemories)

module.exports = router;
