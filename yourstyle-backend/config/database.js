// config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'hitechshop',
  user:     process.env.DB_USER || 'hitechuser',
  password: process.env.DB_PASSWORD || '',
  ssl:      false, // если нужен SSL — настройте тут
  max:      10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Экспортируем весь pool: и .query, и .connect
module.exports = pool;