const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('../db');
const bcrypt = require('bcryptjs');

async function seedUsers() {
  const file = path.join(__dirname, '..', 'seeds', 'users.json');
  const list = JSON.parse(fs.readFileSync(file, 'utf8'));
  const sql = `
    INSERT INTO users (email, password_hash, name, role)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          role = EXCLUDED.role
    RETURNING id, email, role;
  `;
  await db.query('BEGIN');
  try {
    for (const u of list) {
      const hash = await bcrypt.hash(u.password, 10);
      await db.query(sql, [u.email, hash, u.name || '', u.role || 'user']);
    }
    await db.query('COMMIT');
    console.log('Seeded users:', list.length);
  } catch (e) {
    await db.query('ROLLBACK');
    console.error('Seeding users failed:', e);
    process.exit(1);
  }
}

seedUsers().then(() => process.exit(0));
