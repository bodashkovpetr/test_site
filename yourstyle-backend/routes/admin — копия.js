// routes/admin.js
const router = require('express').Router();
const { Pool } = require('pg');

// ?????: ? ??? ????? ?????????? "middleware" (??? s)
const authModule = require('../middleware/auth');
const auth = authModule.authMiddleware || authModule; // ?????????? ? ????? ?????????
const { adminOnly } = authModule;

// ????? ?????????? ????? pool ?? ?????? ???????, ???? ?? ????:
// const { pool } = require('../db');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false } // ???? ?????????
});

const SAFE_SORT = new Set(['created_at', 'email', 'name']);

router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const offset = (page - 1) * limit;

    const search = (req.query.search || '').trim();
    const sort   = SAFE_SORT.has(req.query.sort) ? req.query.sort : 'created_at';
    const dir    = (req.query.dir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const params = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`, `%${search}%`);
      where = `WHERE email ILIKE $1 OR name ILIKE $2`;
    }

    // total
    const countSql = `SELECT COUNT(*)::int AS total FROM public.users ${where}`;
    const { rows: crow } = await pool.query(countSql, params);
    const total = crow[0]?.total || 0;

    // list
    params.push(limit, offset);
    const listSql = `
      SELECT id, name, email, role, created_at
      FROM public.users
      ${where}
      ORDER BY ${sort} ${dir}
      LIMIT $${params.length-1} OFFSET $${params.length}
    `;
    const { rows } = await pool.query(listSql, params);

    res.json({ data: { total, page, limit, users: rows } });
  } catch (e) {
    console.error('GET /api/admin/users error:', e);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

module.exports = router;