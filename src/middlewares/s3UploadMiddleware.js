// Invoke config variables
require('dotenv').config();

// Load dependencies
const multer = require('multer')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require("sharp");

// Load utilities
const utilities = require('../util/utilities')

// Set up the multer storage engine for file uploads (in-memory storage)
const storage = multer.memoryStorage();

// Set up the S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// S3 upload function
const upload = async (req, res, next) => {

    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
      
    // Get file details
    const { buffer } = req.file;
      
    // Define the S3 PutObjectCommand
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: req.fileName,
      Body: buffer,
      ACL: 'public-read'
    });
      
    try {
      // Upload the file to S3
      const data = await s3.send(command);
      
      // Respond with the URL of the uploaded file
      const fileUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.S3_BUCKET_NAME}/${req.fileName}`;
              
      // Image upload successful
      req.s3URL = fileUrl
      next()
      
    } catch (err) {
      console.error('Error uploading image:', err);
      res.status(500).send('Error uploading image.');
    }  
}

const uploadThumbnail = async (req, res, next) => {

  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
    
  // Get file details
  const { buffer } = req.file;
   
  // Generate a thumbnail version of the original image
  const resizedImageBuffer = await sharp(buffer)
    .resize(200, 200, {fit: 'inside', position: 'left top'})
    .toBuffer();  

  // Define the S3 PutObjectCommand
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: req.thumbName,
    Body: resizedImageBuffer,
    ACL: 'public-read'
  });
    
  try {
    // Upload the file to S3
    const data = await s3.send(command);
    
    // Respond with the URL of the uploaded file
    const fileUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.S3_BUCKET_NAME}/${req.thumbName}`;
            
    // Image upload successful
    req.s3ThumbUrl = fileUrl
    next()
    
  } catch (err) {
    console.error('Error uploading thumbnail:', err);
    res.status(500).send('Error uploading thumbnail.');
  }  
}

const createFilename = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  try {
    const { originalname }= req.file;
    const dateNow = Date.now()
    const fileName = `${dateNow}-${originalname.replace(/\s+/g, '_')}`;
    const thumbName = `${dateNow}-${originalname.replace(/\s+/g, '_')}`;  
    req.fileName = `${process.env.S3_UPLOAD_FOLDER}/${fileName}`
    req.thumbName = `${process.env.S3_THUMB_FOLDER}/${thumbName}`
    console.log(req.fileName)
    console.log(req.thumbName)
    next()
  }
  catch(error) {
    console.error('Error creating file name:', err);
    res.status(500).send('Error creating file name.');
  }
}

// Multer upload function
const multerUploadFunc = multer({
  storage: storage,
  limits: {},
  fileFilter: (req, file, cb) => {
    if (!utilities.validateMimeType(file)) {
      return cb(new Error("Invalid file type. Only PNG and JPG allowed."), false);
    }
    cb(null, true);
  }
}).single(process.env.UPLOAD_IMAGE_FIELD_NAME)

// Upload middleware using the multer upload function
const storageBasedUpload = (req, res, next) => {
  multerUploadFunc(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message })
    }
    next()
  })
}

// Double check file type
const checkMagicBytes = (req, res, next) => {
  // Check file type by checking its magic bytes
  const fileType = utilities.checkMagicBytes(req.file.buffer);
  console.log(`File type is ${fileType}...`)
  
  if (!fileType) {
    return res.status(400).json({ success: false, error: "Invalid file content." });
  }
  next()
}

// Check file size
const checkFileSize = (req, res, next) => {
  const fileSize = parseFloat((req.file.size / 1024  / 1024).toFixed(2))
  console.log(`File size is ${fileSize} MB...The limit is ${parseFloat(process.env.UPLOAD_IMAGE_LIMIT_MB)} MB`)
  
  if(fileSize > parseFloat(process.env.UPLOAD_IMAGE_LIMIT_MB)) {
    return res.status(400).json({ success: false, error: "Uploaded image too large." });
  }  
  next()
}

module.exports = {
  createFilename: createFilename,
  upload: upload,
  uploadThumbnail: uploadThumbnail,
  checkMagicBytes: checkMagicBytes,
  storageBasedUpload: storageBasedUpload,
  checkFileSize: checkFileSize
}