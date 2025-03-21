const express = require('express');
const { register, login, logout, verifyEmail, resetPassword, requestPasswordReset } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/verify-email/:token?', verifyEmail);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password/:token?', resetPassword);

module.exports = router;
