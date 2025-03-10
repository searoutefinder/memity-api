require('dotenv').config();
const http = require('http')
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Express application
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_APP_URL,
    //origin: true,
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

// Import API routes
const authRoutes = require('./src/routes/authRoutes');
const v1Routes = require('./src/routes/routes-v1');

// API home
app.get('/', (req, res) => {
  res.json({
    api_name: 'Memity API',
    message: 'Welcome to the Memity API!'
  });
});

// API Versioning
app.use('/auth', authRoutes);
app.use('/api/v1', v1Routes);

// API Throttling
app.use('/api/v1', limiter);


const httpServer = http.createServer(app)

httpServer.listen(process.env.APP_PORT, () => {
  console.log(`HTTP Server running in development mode on port ${process.env.APP_PORT}`)
})
