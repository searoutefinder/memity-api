// Invoke Express essentials
const express = require('express');
const router = express.Router();

// Invoke logic for endpoints
const endpts = {
  user: require('./v1/user'),
  users: require('./v1/users'),
  memories: require('./v1/memories'),
  memory: require('./v1/memory'),
  likes: require('./v1/likes'),
  maplabels: require('./v1/maplabels'),
  me: require('./v1/me')
}

router.use('/user', endpts.user)
router.use('/users', endpts.users)
router.use('/memories', endpts.memories)
router.use('/memory', endpts.memory)
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
