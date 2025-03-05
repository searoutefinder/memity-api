require('dotenv').config();
const fs = require('fs')
const http = require('http')
const https = require('https')
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


if(process.env.NODE_ENV === 'production') {
  
  // SSL Certificate
  const privateKey = fs.readFileSync(process.env.SSL_KEY, 'utf8')
  const certificate = fs.readFileSync(process.env.SSL_CERT, 'utf8')
  const ca = fs.readFileSync(process.env.SSL_CA_BUNDLE, 'utf8')

  // SSL Credentials
  const credentials = {
    "key": privateKey,
    "cert": certificate,
    "ca": ca
  }

  const httpsServer = https.createServer(credentials, app)
  const httpServer = http.createServer(app)

  httpServer.listen(process.env.APP_PORT, () => {
    console.log(`HTTP Server running in production mode on port ${process.env.APP_PORT}`)
  })

  httpsServer.listen(443, () => {
    console.log(`HTTPS Server running in production mode on port 443`)
  })
}
else if(process.env.NODE_ENV === 'development')
{
  const httpServer = http.createServer(app)
  httpServer.listen(process.env.APP_PORT, () => {
    console.log(`HTTP Server running in development mode on port ${process.env.APP_PORT}`)
  })
}
