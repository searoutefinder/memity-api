const express = require('express')
const { query } = require('../dbService')
const crypto = require('crypto')

const router = express.Router()

router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Generate a secure verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

        // Save user to DB
        await query(
            `INSERT INTO users (email, password, verification_token, token_expires_at) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [email, password, verificationToken, tokenExpiresAt]
        );

        // Send a verification email (pseudo-code, replace with real email service)
        console.log(`Verification link: https://yourapp.com/verify-email?token=${verificationToken}`);

        res.json({ message: 'Registration successful! Please check your email for verification.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/login', async (req, res) => {

})

// 📌 2️⃣ Verify Email
router.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params.token;

    try {
        // Check if token is valid and not expired
        const user = await query(
            `SELECT id FROM users WHERE verification_token = $1 AND token_expires_at > NOW()`,
            [token]
        );

        if (user.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        // Mark email as verified
        await query(
            `UPDATE users SET is_verified = TRUE, verification_token = NULL, token_expires_at = NULL WHERE id = $1`,
            [user[0].id]
        );

        res.json({ message: 'Email verified successfully! You can now log in.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
