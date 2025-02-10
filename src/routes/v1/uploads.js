// Invoke config variables
require('dotenv').config();

// Invoke dependencies
const express = require('express');
const multer = require('multer');

// Invoke controllers
const authMiddleware = require('../../middlewares/authMiddleware')

// Invoke middleware functions
const s3UploadMiddleware = require('../../middlewares/s3UploadMiddleware')
const s3ModerateMiddleware = require('../../middlewares/s3ModerateMiddleware')
const detectCountryMiddleware = require('../../middlewares/detectCountryMiddleware')

// Set up multer storage engine for file uploads (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

// POST - /uploads Upload a new image to system
router.post(
  '/',
  authMiddleware.authenticateJWT,
  upload.single('photo'), 
  s3UploadMiddleware.upload, 
  detectCountryMiddleware.detectIPandCountry, 
  s3ModerateMiddleware.moderate, 
  async (req, res, next) => {
    console.log({...req.moderationStatus, ...{ip: req.userIP, iso: req.userCountry}})
    res.json({...req.moderationStatus, ...{ip: req.userIP, iso: req.userCountry}})
  }
);

// GET - /uploads Load uploaded images from server
router.get('/', (req, res, next) => {
  res.json({
    api_name: "Memity API",
    version: "v1",
    endpoint: "uploads",
    method: "GET",
    message: "GET v1/uploads"    
  })
})

// PUT - /uploads Modify an upload in the system
router.put('/', () => {

})

// DELETE - /uploads Delete an upload from the system
router.delete('/', () => {

})

module.exports = router;
