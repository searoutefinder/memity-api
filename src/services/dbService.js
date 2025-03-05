require('dotenv').config();
const { Pool } = require('pg');

// Create a global connection pool
const pool = new Pool({
  connectionString: process.env.DB_URL, 
  max: 20, // Increase max connections
  idleTimeoutMillis: 10000, // Close idle connections after 10 seconds
  connectionTimeoutMillis: 5000, // Wait max 5s for a connection
});

// Execute queries with automatic connection handling
const query = async (text, params) => {
  const client = await pool.connect(); // Get a client from the pool
  try {
    const result = await client.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release(); // Always release the connection back to the pool
  }
};

// Gracefully shut down DB pool on app exit
const closePool = async () => {
  console.log('Closing database connection pool...');
  await pool.end();
};

process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

module.exports = { query };
