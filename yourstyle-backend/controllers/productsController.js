// C:\apps\yourstyle-backend\controllers\productsController.js
const db = require('../db');

exports.getAllProducts = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, category, description, price_cents, image_url, created_at
       FROM products
       ORDER BY id`
    );
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('DB error getAllProducts:', e);
    res.status(500).json({ success: false, error: 'DB error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, category, description, price_cents, image_url, created_at
       FROM products
       WHERE id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    console.error('DB error getProductById:', e);
    res.status(500).json({ success: false, error: 'DB error' });
  }
};

exports.searchProducts = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return exports.getAllProducts(req, res);
  try {
    const { rows } = await db.query(
      `SELECT id, name, category, description, price_cents, image_url, created_at
       FROM products
       WHERE name ILIKE '%' || $1 || '%'
          OR description ILIKE '%' || $1 || '%'
          OR category ILIKE '%' || $1 || '%'
       ORDER BY id`,
      [q]
    );
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('DB error searchProducts:', e);
    res.status(500).json({ success: false, error: 'DB error' });
  }
};