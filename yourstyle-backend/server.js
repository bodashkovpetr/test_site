// server.js
console.log('BOOT: server.js loaded at', new Date().toISOString());
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const usersRoutes = require('./routes/users');

const app = express();
app.set('etag', false);
app.set('trust proxy', true);

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/* ---------------- CORS ---------------- */
function parseEnvOrigins() {
  if (!process.env.CORS_ORIGIN) return [];
  return process.env.CORS_ORIGIN
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

const baseAllowed = [
  'http://localhost',
  'http://127.0.0.1',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://yourstyle.space',
  'https://www.yourstyle.space',
  'https://plitka.live',
  'https://www.plitka.live'
];

const reYourstyle = /^https?:\/\/(www\.)?yourstyle\.space(?::\d+)?$/i;
const rePlitka   = /^https?:\/\/(www\.)?plitka\.live(?::\d+)?$/i;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const u = new URL(origin);
    const normalized = `${u.protocol}//${u.hostname}${u.port ? ':' + u.port : ''}`.toLowerCase();
    if (reYourstyle.test(normalized) || rePlitka.test(normalized)) return true;
    const envList = parseEnvOrigins();
    const allowedList = envList.length ? envList : baseAllowed;
    return allowedList.some(a =>
      normalized === a.toLowerCase() || normalized.startsWith(a.toLowerCase())
    );
  } catch {
    return false;
  }
}

const corsOptions = {
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
// ?????: ??? Express 5 ?????????? RegExp, ? ?? '*'
app.options(/^\/.*$/, cors(corsOptions));

/* -------------- Middleware -------------- */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/admin', require('./routes/admin'));

/* -------------- Health -------------- */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

app.get('/api/health', async (req, res) => {
  const started = Date.now();
  let dbStatus = 'skip';
  try {
    try {
      const db = require('./config/database');
      if (db && typeof db.query === 'function') {
        await db.query('SELECT 1');
        dbStatus = 'up';
      }
    } catch {
      dbStatus = 'skip';
    }
    return res.status(200).json({
      ok: true,
      status: 'up',
      db: dbStatus,
      environment: NODE_ENV,
      uptimeSec: Math.round(process.uptime()),
      responseTimeMs: Date.now() - started
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      status: 'degraded',
      db: 'down',
      error: e.message
    });
  }
});

/* ---- ??????????? ????????? (?????????? ??????????) ---- */
if (process.env.EXPOSE_ROUTES === 'true') {
  app.get('/__routes', (req, res) => {
    try {
      const routes = [];
      app._router.stack.forEach((m) => {
        if (m.route && m.route.path) {
          const methods = Object.keys(m.route.methods).join(',').toUpperCase();
          routes.push(`${methods} ${m.route.path}`);
        } else if (m.name === 'router' && m.handle?.stack) {
          m.handle.stack.forEach((h) => {
            if (h.route && h.route.path) {
              const methods = Object.keys(h.route.methods).join(',').toUpperCase();
              routes.push(`${methods} ${h.route.path}`);
            }
          });
        }
      });
      res.json({ routes });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

/* -------------- API Routes -------------- */
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/users', usersRoutes);

// ?????
app.get('/api/search', require('./controllers/productsController').searchProducts);

/* -------------- 404 -------------- */
app.use((req, res) => {
  console.warn('404 for:', req.method, req.originalUrl);
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

/* -------------- Global error handler -------------- */
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

/* -------------- Start -------------- */
app.listen(PORT, () => {
  console.log(`
+--------------------------------------------+
¦   YourStyle Backend Server                 ¦
¦   Environment: ${NODE_ENV.padEnd(18)}      ¦
¦   Port: ${PORT.toString().padEnd(35)} ¦
¦   Status: Running ?                        ¦
+--------------------------------------------+
  `);
});

/* -------------- Graceful shutdown -------------- */
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});