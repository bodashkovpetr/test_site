const db = require('../db');

exports.dbCheck = async (req, res, next) => {
  try {
    const info = await db.query(`SELECT current_database() db, current_user usr, inet_server_addr()::text server_addr, inet_server_port() server_port, version() version`);
    const counts = {};
    for (const t of ['users','products','cart_items','orders','order_items']) {
      try {
        const r = await db.query(`SELECT COUNT(*)::int total FROM ${t}`);
        counts[t] = r.rows[0].total;
      } catch (e) {
        counts[t] = 'missing';
      }
    }
    let migrations = [];
    try {
      const m = await db.query('SELECT name, applied_at FROM __migrations ORDER BY id');
      migrations = m.rows;
    } catch (e) {
      migrations = [];
    }
    const idx = await db.query(`
      SELECT indexname FROM pg_indexes WHERE tablename IN ('products','users')
    `);
    res.json({ success: true, data: { info: info.rows[0], counts, migrations, indexes: idx.rows } });
  } catch (e) { next(e); }
};

exports.users = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT id, email, role, created_at FROM users ORDER BY id LIMIT 200');
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

exports.promote = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ success:false, error:'email required' });
    const newRole = role || 'admin';
    const { rows } = await db.query('UPDATE users SET role=$2 WHERE email=$1 RETURNING id, email, role', [email, newRole]);
    if (!rows.length) return res.status(404).json({ success:false, error:'User not found' });
    res.json({ success:true, data: rows[0] });
  } catch (e) { next(e); }
};

exports.allOrders = async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT o.id, o.user_id, u.email, o.total_amount, o.status, o.created_at
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.id DESC
      LIMIT 200
    `);
    res.json({ success:true, data: rows });
  } catch (e) { next(e); }
};
