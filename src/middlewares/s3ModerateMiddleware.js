require('dotenv').config();

const utilities = require('../util/utilities')

const moderate = async (req, res, next) => {
  const imageData = await utilities.moderateS3Image(req.s3URL)
  console.log(imageData)
  if(imageData.isSafe) {
    console.log("The image is considered to be safe")
    req.moderationStatus = imageData
    next()
  }
  else
  {

    const deletionStatus = await utilities.deleteS3Image(req.s3URL)
        
    if( deletionStatus.success ) {
      res.status(200).json({status: 200, message: "Image rejected due to conflict with our moderation guidelines."})
    }
    else
    {
      res.status(400).json({status: 400, message: "There was an issue deleting the image after moderation."})
    }    
  }
}

module.exports = {
  moderate: moderate
}