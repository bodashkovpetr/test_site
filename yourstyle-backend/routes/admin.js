// routes/admin.js
const router = require('express').Router();

// ?????????? ????: "middleware" (??? s)
const authModule = require('../middleware/auth');
const auth = authModule.authMiddleware || authModule;
const { adminOnly } = authModule;

// ????? ????? pool, ???? ?? ????; ????? ??????? ?????
let pool;
try {
  const db = require('../db');           // ????? ?????? ?? (???? ????)
  pool = db.pool || db;                  // pool ??? ??? ??????
  if (!pool.query) throw new Error('db module has no .query');
} catch {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // ssl: { rejectUnauthorized: false } // ???????????????? ??? ?????????????
  });
}

// ???????????
router.get('/ping', auth, adminOnly, async (req, res) => {
  try {
    const r = await pool.query('SELECT NOW() AS now');
    res.json({ ok: true, now: r.rows[0].now, user: req.user });
  } catch (e) {
    console.error('GET /api/admin/ping failed:', e.code, e.message);
    res.status(500).json({ error: e.message, code: e.code });
  }
});

// ??? ??????? users ?? 60 ???
let cachedCols = null;
let cachedAt = 0;
async function getUserColumnsSafe() {
  try {
    const now = Date.now();
    if (cachedCols && now - cachedAt < 60_000) return cachedCols;
    const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='users'
    `);
    cachedCols = new Set(rows.map(r => r.column_name));
    cachedAt = now;
    return cachedCols;
  } catch (e) {
    // fallback: ??????????? ?????
    return new Set(['id', 'email']);
  }
}

router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const cols = await getUserColumnsSafe();
    const has = (c) => cols.has(c);

    const limit  = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 200);
    const page   = Math.max(parseInt(req.query.page || '1', 10), 1);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const askSort = (req.query.sort || 'id').toLowerCase();
    const dir     = (req.query.dir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    // ???????????? SELECT
    const selectCols = ['id'];
    if (has('email'))      selectCols.push('email');
    if (has('name'))       selectCols.push('name');
    if (has('role'))       selectCols.push('role');
    if (has('created_at')) selectCols.push('created_at');

    // ??????????? ?????????? ?????? ?? ??????? ????????? ????????
    const allowSort = new Set(selectCols);
    const sort = allowSort.has(askSort) ? askSort : 'id';

    // WHERE ??? ?????? (email/name ???? ????)
    const params = [];
    let where = '';
    if (search) {
      const parts = [];
      if (has('email')) { parts.push(`email ILIKE $${params.length + 1}`); params.push(`%${search}%`); }
      if (has('name'))  { parts.push(`name  ILIKE $${params.length + 1}`); params.push(`%${search}%`); }
      if (parts.length) where = 'WHERE ' + parts.join(' OR ');
    }

    // total
    const { rows: crow } = await pool.query(`SELECT COUNT(*)::int AS total FROM public.users ${where}`, params);
    const total = crow[0]?.total || 0;

    // list
    params.push(limit, offset);
    const listSql = `
      SELECT ${selectCols.join(', ')}
      FROM public.users
      ${where}
      ORDER BY ${sort} ${dir}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const { rows } = await pool.query(listSql, params);

    res.json({ data: { total, page, limit, sort, dir, users: rows } });
  } catch (e) {
    console.error('GET /api/admin/users error:', e.code, e.message);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

module.exports = router;