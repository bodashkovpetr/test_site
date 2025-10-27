// controllers/ordersController.js
const db = require('../config/database');

const DEBUG_ERRORS = (process.env.DEBUG_ERRORS || '').toLowerCase() === 'true';

// ??????, ????? ??????? ??????? ???? ? ???????
async function getExistingColumns(table, candidates) {
  const { rows } = await db.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema='public'
        AND table_name = $1
        AND column_name = ANY($2::text[])`,
    [table, candidates]
  );
  const set = new Set(rows.map(r => r.column_name));
  return candidates.filter(c => set.has(c));
}

// ?????????? ???????? ??????? ??? ???????
async function resolveCartTable(client) {
  const { rows } = await client.query(`
    SELECT
      to_regclass('public.cart_items') AS cart_items,
      to_regclass('public.cart')       AS cart,
      to_regclass('public.carts')      AS carts
  `);
  const r = rows[0] || {};
  if (r.cart_items) return 'cart_items';
  if (r.cart)       return 'cart';
  if (r.carts)      return 'carts';
  return null;
}

// ????????????? “??????”: ???? ???? db.connect — ?????????? ??? (??????????),
// ???? ??? — ???????? ????? ????? db.query (??? ??????????), ? ????????????.
async function withClient(fn) {
  if (db && typeof db.connect === 'function') {
    const client = await db.connect();
    try { return await fn(client, true); } finally { client.release(); }
  } else {
    const fakeClient = { query: (...args) => db.query(...args) };
    return await fn(fakeClient, false);
  }
}

exports.checkout = async (req, res) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const result = await withClient(async (client, canTx) => {
      if (canTx) await client.query('BEGIN');

      // ?????????? ??????? ???????
      const cartTable = await resolveCartTable(client);
      if (!cartTable) {
        if (canTx) await client.query('ROLLBACK');
        return {
          code: 500,
          body: { success: false, error: 'Cart storage table not found (expected cart_items/cart/carts)' }
        };
      }
      console.log(`[orders] using cart table: ${cartTable}`);

      // 1) ??????? ??????? ? ??????
      const cartQ = `
        SELECT c.product_id::text AS product_id,
               c.quantity,
               p.name,
               p.category,
               p.price_cents,
               COALESCE(p.image_url,'') AS image_url
          FROM ${cartTable} c
          JOIN products p ON p.id::text = c.product_id::text
         WHERE c.user_id = $1
      `;
      const { rows: cartRows } = await client.query(cartQ, [userId]);
      if (cartRows.length === 0) {
        if (canTx) await client.query('ROLLBACK');
        return { code: 400, body: { success: false, error: 'Cart is empty' } };
      }

      // 2) ??????? total ? ??????? items
      const items = cartRows.map(r => ({
        product_id: r.product_id,
        quantity: r.quantity,
        price_cents: r.price_cents,
        line_total_cents: r.price_cents * r.quantity,
        name: r.name,
        category: r.category,
        image_url: r.image_url
      }));
      const total_cents = items.reduce((s, it) => s + it.line_total_cents, 0);

      // 3) ??????? ?????
      const ordIns = await client.query(
        `INSERT INTO orders (user_id, total_cents, status, created_at)
         VALUES ($1,$2,'pending', NOW())
         RETURNING id, user_id, total_cents, status, created_at`,
        [userId, total_cents]
      );
      const order = ordIns.rows[0];

      // 4) ???????????? ??????? ? order_items
      const optionalCols = await getExistingColumns('order_items', [
        'line_total_cents', 'name', 'category', 'image_url'
      ]);

      // 5) ????????? ??????? (?? ????? — ??????????? ??????????)
      for (const it of items) {
        const cols = ['order_id', 'product_id', 'quantity', 'price_cents'];
        const vals = [order.id, it.product_id, it.quantity, it.price_cents];

        if (optionalCols.includes('line_total_cents')) { cols.push('line_total_cents'); vals.push(it.line_total_cents); }
        if (optionalCols.includes('name'))             { cols.push('name');             vals.push(it.name); }
        if (optionalCols.includes('category'))         { cols.push('category');         vals.push(it.category); }
        if (optionalCols.includes('image_url'))        { cols.push('image_url');        vals.push(it.image_url); }

        const params = vals.map((_, i) => `$${i + 1}`).join(', ');
        await client.query(`INSERT INTO order_items (${cols.join(',')}) VALUES (${params})`, vals);
      }

      // 6) ?????? ??????? ?? ????????? ???????
      await client.query(`DELETE FROM ${cartTable} WHERE user_id = $1`, [userId]);

      if (canTx) await client.query('COMMIT');

      order.items = items;
      return { code: 201, body: { success: true, data: { order } } };
    });

    return res.status(result.code).json(result.body);
  } catch (e) {
    console.error('checkout error:', e.stack || e);
    return res.status(500).json({
      success: false,
      error: DEBUG_ERRORS ? (e.message || 'Server error') : 'Server error'
    });
  }
};

exports.listMyOrders = async (req, res) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const { rows: orders } = await db.query(
      `SELECT id, user_id, total_cents, status, created_at
         FROM orders
        WHERE user_id = $1
        ORDER BY id DESC
        LIMIT 200`,
      [userId]
    );

    // ?????? ??????? order_items
    const { rows: colRows } = await db.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema='public' AND table_name='order_items'`
    );
    const cols = new Set(colRows.map(r => r.column_name));

    const result = [];
    for (const o of orders) {
      const sel = [
        'id',
        'order_id',
        'product_id::text AS product_id',
        'quantity',
        'price_cents'
      ];
      if (cols.has('line_total_cents')) {
        sel.push('line_total_cents');
      } else {
        sel.push('(price_cents * quantity) AS line_total_cents');
      }
      const { rows: items } = await db.query(
        `SELECT ${sel.join(', ')}
           FROM order_items
          WHERE order_id = $1
          ORDER BY id ASC`,
        [o.id]
      );
      result.push({ ...o, items });
    }

    return res.json({ success: true, data: { orders: result } });
  } catch (e) {
    console.error('listMyOrders error:', e.stack || e);
    return res.status(500).json({
      success: false,
      error: DEBUG_ERRORS ? (e.message || 'Server error') : 'Server error'
    });
  }
};

exports.getOrderById = async (req, res) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const oid = parseInt(req.params.id, 10);
  if (!Number.isFinite(oid)) {
    return res.status(400).json({ success: false, error: 'Invalid order id' });
  }

  try {
    const { rows: orows } = await db.query(
      `SELECT id, user_id, total_cents, status, created_at
         FROM orders
        WHERE id = $1`,
      [oid]
    );
    if (orows.length === 0) return res.status(404).json({ success: false, error: 'Order not found' });
    if (orows[0].user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

    const { rows: colRows } = await db.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema='public' AND table_name='order_items'`
    );
    const cols = new Set(colRows.map(r => r.column_name));

    const sel = [
      'id',
      'order_id',
      'product_id::text AS product_id',
      'quantity',
      'price_cents'
    ];
    if (cols.has('line_total_cents')) {
      sel.push('line_total_cents');
    } else {
      sel.push('(price_cents * quantity) AS line_total_cents');
    }

    const { rows: items } = await db.query(
      `SELECT ${sel.join(', ')}
         FROM order_items
        WHERE order_id = $1
        ORDER BY id ASC`,
      [oid]
    );

    return res.json({ success: true, data: { order: { ...orows[0], items } } });
  } catch (e) {
    console.error('getOrderById error:', e.stack || e);
    return res.status(500).json({
      success: false,
      error: DEBUG_ERRORS ? (e.message || 'Server error') : 'Server error'
    });
  }
};