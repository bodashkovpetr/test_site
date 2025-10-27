require('dotenv').config();
const db = require('../db');

(async () => {
  try {
    const info = await db.query(`SELECT current_database() db, current_user usr, inet_server_addr()::text server_addr, inet_server_port() server_port, version() version`);
    console.log('INFO:', info.rows[0]);

    const pr = await db.query(`SELECT COUNT(*)::int total FROM products`);
    const us = await db.query(`SELECT COUNT(*)::int total FROM users`);
    const ci = await db.query(`SELECT COUNT(*)::int total FROM cart_items`);
    const orr = await db.query(`SELECT COUNT(*)::int total FROM orders`);
    const oi = await db.query(`SELECT COUNT(*)::int total FROM order_items`);

    console.log('COUNTS:', { products: pr.rows[0].total, users: us.rows[0].total, cart_items: ci.rows[0].total, orders: orr.rows[0].total, order_items: oi.rows[0].total });

    const { rows } = await db.query(`SELECT id,name,category,price,image_url FROM products ORDER BY id`);
    console.log('PRODUCTS SAMPLE:', rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
