const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('../db');

async function seedProducts() {
  const file = path.join(__dirname, '..', 'seeds', 'products.json');
  const list = JSON.parse(fs.readFileSync(file, 'utf8'));
  const sql = `
    INSERT INTO products (id, name, description, category, price, image_url, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          price = EXCLUDED.price,
          image_url = EXCLUDED.image_url,
          updated_at = NOW();
  `;
  await db.query('BEGIN');
  try {
    for (const p of list) {
      await db.query(sql, [p.id, p.name, p.description || '', p.category, p.price, p.image_url || '']);
    }
    await db.query('COMMIT');
    console.log('Seeded products:', list.length);
  } catch (e) {
    await db.query('ROLLBACK');
    console.error('Seeding products failed:', e);
    process.exit(1);
  }
}

seedProducts().then(() => process.exit(0));
