require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs');
const { extname } = require("path");

const { RekognitionClient, DetectModerationLabelsCommand } = require("@aws-sdk/client-rekognition");
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Set up the S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
})

const getRekognitionParamObj = (objectKey) => {
  if(objectKey === null) {
    return null
  }
  const params = {
    Image: {
      S3Object: {
        Bucket: process.env.S3_BUCKET_NAME,
        Name: objectKey
      }
    }
  }
  return params    
}

const moderateS3Image = async (imageKey) => {

  const rekognition = new RekognitionClient({ region: process.env.AWS_REGION })
  
  try {
    if (!imageKey) {
      return { error: "Missing imageKey" }
    }

    const objectKey = `${process.env.S3_UPLOAD_FOLDER}${imageKey.split(process.env.S3_UPLOAD_FOLDER)[1]}`

    const params = getRekognitionParamObj(objectKey)

    const command = new DetectModerationLabelsCommand(params);
    const response = await rekognition.send(command);

    // Extract detected moderation labels
    const blockedCategories = [
      "Explicit Nudity",
      "Suggestive",
      "Drugs",
      "Alcohol",
      "Tobacco",
      "Violence",
      "Visually Disturbing",
      "Hate Symbols",
      "Abuse"
    ]

    const foundLabels = response.ModerationLabels.filter(label =>
        blockedCategories.includes(label.ParentName)
    );
    
    let isSafe = false
    let detectedLabels = foundLabels

    //let moderationStatus = { safe: false, detectedLabels: foundLabels }

    if (foundLabels.length > 0) {
        // Leave the status as false to indicate that there are problems with the uploaded image
        return {imageKey, isSafe, detectedLabels}
    } else {
        // Label the status as true to indicate that the image is safe to use
        isSafe = true
        return {imageKey, isSafe, detectedLabels}
    }    

  } catch (error) {
    //console.error("Error detecting moderation labels:", error);
    console.log(error)
    return { error: "Internal Server Error", details: error.message }
  }  
}

const deleteS3Image = async (key) => {
  try {

    if (!key) {
      console.log("Missing imageKey, aborting deletion.")
      return { success: false, message: "Missing imageKey" }
    }

    const objectKey = `${process.env.S3_UPLOAD_FOLDER}${key.split(process.env.S3_UPLOAD_FOLDER)[1]}`    
    
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: objectKey,
    })
  
    await s3.send(command)

    console.log(`Image deleted successfully: ${key}`)
    return { success: true, message: "Image deleted successfully" }

  }
  catch (error) {

    console.error("Error deleting image from S3:", error)
    return { success: false, message: error.message }

  }
}

const deleteS3ImageByURL = async (imageUrl) => {
  try {
    const urlParts = new URL(imageUrl);
    const key = urlParts.pathname.substring(1);

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    })    

    await s3.send(command);

    return {
      success: true,
      message: "Image deleted successfully"
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to delete image"
    };
  }
}

const validateMimeType = (file) => {
  const allowedMimeTypes = ["image/png", "image/jpeg"]
  const allowedExtensions = [".png", ".jpg", ".jpeg"]  
  const mimetype = file.mimetype
  const extension = extname(file.originalname).toLowerCase()

  return allowedMimeTypes.includes(mimetype) && allowedExtensions.includes(extension)
}

const magicBytes = {
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47]), // PNG Magic Bytes
  jpg: Buffer.from([0xff, 0xd8, 0xff]),       // JPG Magic Bytes
}

// Function to check magic bytes (file signature)
const checkMagicBytes = (buffer) => {
  if (buffer.subarray(0, 4).equals(magicBytes.png)) return "png";
  if (buffer.subarray(0, 3).equals(magicBytes.jpg)) return "jpg";
  return null; // Not a valid PNG/JPG
}

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  moderateS3Image: moderateS3Image,
  deleteS3Image: deleteS3Image,
  deleteS3ImageByURL: deleteS3ImageByURL,
  validateMimeType: validateMimeType,
  checkMagicBytes: checkMagicBytes,
  generateResetToken: generateResetToken
}