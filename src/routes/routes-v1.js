// Invoke Express essentials
const express = require('express');
const router = express.Router();

// Invoke logic for endpoints
const endpts = {
  users: require('./v1/users'),
  memories: require('./v1/memories'),
  likes: require('./v1/likes'),
  maplabels: require('./v1/maplabels'),
  me: require('./v1/me')
}

router.use('/users', endpts.users)
router.use('/memories', endpts.memories)
router.use('/likes', endpts.likes)
router.use('/maplabels', endpts.maplabels)
router.use('/me', endpts.me)

// Version homepage
router.get('/', (req, res) => {
  res.json({
    api_name: "Memity API",
    version: "v1",
    message: "Welcome to the Memity API"
  });
});


module.exports = router;
