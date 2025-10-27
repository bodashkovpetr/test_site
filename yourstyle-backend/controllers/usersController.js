// controllers/usersController.js
// ???????? fallback: bcrypt ? bcryptjs
let bcrypt;
try { bcrypt = require('bcrypt'); } catch { bcrypt = require('bcryptjs'); }

const db = require('../config/database');

// ??? ??????? ??????? users
let usersColumnsCache = null;
async function usersHasColumn(col) {
  if (!usersColumnsCache) {
    const res = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    usersColumnsCache = new Set(res.rows.map(r => r.column_name));
  }
  return usersColumnsCache.has(col);
}
function selectList(cols) { return cols.join(', '); }

// GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const cols = ['id', 'email', 'name', 'phone', 'created_at'];
    if (await usersHasColumn('address')) cols.push('address');
    if (await usersHasColumn('updated_at')) cols.push('updated_at');

    const { rows } = await db.query(
      `SELECT ${selectList(cols)} FROM users WHERE id = $1`,
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    return res.json({ success: true, data: { user: rows[0] } });
  } catch (e) {
    console.error('getMe error:', e);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// PUT /api/users/me
exports.updateMe = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { name, email, phone, address, password } = req.body;

    const hasAddress = await usersHasColumn('address');
    const hasUpdated = await usersHasColumn('updated_at');

    const fields = [];
    const values = [];
    let i = 1;

    if (name !== undefined) { fields.push(`name = $${i++}`); values.push(name); }

    if (email !== undefined) {
      const existing = await db.query(
        'SELECT 1 FROM users WHERE email = $1 AND id <> $2',
        [email, userId]
      );
      if (existing.rowCount > 0) {
        return res.status(409).json({ success: false, error: 'Email already in use' });
      }
      fields.push(`email = $${i++}`);
      values.push(email);
    }

    if (phone !== undefined) { fields.push(`phone = $${i++}`); values.push(phone); }

    if (address !== undefined) {
      if (hasAddress) {
        fields.push(`address = $${i++}`);
        values.push(address);
      } else {
        return res.status(400).json({ success: false, error: 'Address field is not supported' });
      }
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      fields.push(`password_hash = $${i++}`);
      values.push(hash);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    if (hasUpdated) fields.push('updated_at = NOW()');

    const returning = ['id', 'email', 'name', 'phone', 'created_at'];
    if (hasAddress) returning.push('address');
    if (hasUpdated) returning.push('updated_at');

    const q = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${i}
      RETURNING ${selectList(returning)}
    `;
    values.push(userId);

    const { rows } = await db.query(q, values);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    return res.json({ success: true, data: { user: rows[0] } });
  } catch (e) {
    console.error('updateMe error:', e);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/users  (?????? admin ??? ???? ALLOW_USERS_LIST=true)
exports.listUsers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const offset = parseInt(req.query.offset || '0', 10);

    const cols = ['id', 'email', 'name', 'phone', 'created_at'];
    if (await usersHasColumn('address')) cols.push('address');
    if (await usersHasColumn('updated_at')) cols.push('updated_at');

    const { rows } = await db.query(
      `SELECT ${selectList(cols)} FROM users ORDER BY id DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return res.json({ success: true, data: { users: rows, limit, offset } });
  } catch (e) {
    console.error('listUsers error:', e);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};