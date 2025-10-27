// C:\apps\yourstyle-backend\db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false,
});

pool.query('SELECT 1').then(() => {
  console.log('DB connection OK');
}).catch(err => {
  console.error('DB connection ERROR:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};