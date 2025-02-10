require('dotenv').config();

const validateMemoryId = (req, res, next) => {
  if (!req.params.memoryId) {
    return res.status(400).json({ error: "Missing or invalid parameter: memoryId" });
  }
  next();
};

module.exports = {
  validateMemoryId: validateMemoryId
}