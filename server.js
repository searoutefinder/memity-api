require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 9000;

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Middleware
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true
  })
);

app.use(express.json());
app.use(helmet());
app.use(cookieParser());

// Rate limiter
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests, slow down!',
    retryAfter: 'Try again in 15 minutes'
  }  
});

// API home
app.get('/', (req, res) => {
  res.json({
    api_name: 'Memity API',
    message: 'Welcome to the Memity API!'
  });
});

// Import API routes
const authRoutes = require('./src/routes/authRoutes');
const v1Routes = require('./src/routes/routes-v1');

// API Versioning
app.use('/auth', authRoutes);
app.use('/api/v1', v1Routes);

// API Throttling
app.use('/api/v1', limiter);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
