const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'pr-demo',
});

// Initialize database schema
async function initDb() {
  try {
    const client = await pool.connect();
    console.log(`> [Database] Connected successfully to PostgreSQL database "${process.env.DB_NAME || 'pr-demo'}"`);

    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'Member',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('> [Database] "users" table is ready.');
    client.release();
    return true;
  } catch (err) {
    console.error('> [Database] Connection error:', err.message);
    console.error('> [Database] Tip: Please ensure PostgreSQL is running and DB_PASSWORD in .env matches your pgAdmin 4 postgres password.');
    return false;
  }
}

module.exports = {
  pool,
  initDb,
};
