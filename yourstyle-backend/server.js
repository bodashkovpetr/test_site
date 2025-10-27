// Robust Express server with healthz and safe DB handling

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();

const { Pool } = require('pg');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Config
const PORT = Number(process.env.PORT) || 3001;
const HOST = '0.0.0.0';

// DB pool (lazy-friendly): если переменных нет, не падаем
let pool = null;
try {
  const cfg = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'app',
    database: process.env.DB_NAME || 'app_test',
    max: 5,
    idleTimeoutMillis: 10000
  };
  pool = new Pool(cfg);
  // Пробуем соединение, но не валим процесс при ошибке
  pool.connect()
    .then(c => c.release())
    .then(() => console.log('[DB] connection OK'))
    .catch(err => console.warn('[DB] initial connect failed:', err.message));
} catch (err) {
  console.warn('[DB] pool init error:', err.message);
}

// Routes
app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true, service: 'yourstyle-backend' });
});

app.get('/api/health', async (_req, res) => {
  if (!pool) {
    return res.status(200).json({ db: 'skip', ok: true });
  }
  try {
    const r = await pool.query('SELECT 1 as ok');
    res.status(200).json({ ok: true, db: r.rows[0].ok === 1 ? 'up' : 'unknown' });
  } catch (err) {
    res.status(200).json({ ok: true, db: 'down', error: err.message });
  }
});

// Example: add your API routes here
// app.use('/api/products', productsRouter);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start
const server = app.listen(PORT, HOST, () => {
  console.log(`[HTTP] listening on http://${HOST}:${PORT}`);
});

// Safety: do not crash the process in CI, just log
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
});
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server');
  server.close(() => process.exit(0));
});