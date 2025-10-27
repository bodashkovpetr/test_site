const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('../db');

async function ensureMigrationsTable() {
  await db.query(`CREATE TABLE IF NOT EXISTS __migrations (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);
}

async function appliedNames() {
  const { rows } = await db.query('SELECT name FROM __migrations ORDER BY id');
  return new Set(rows.map(r => r.name));
}

async function up() {
  await ensureMigrationsTable();
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  const applied = await appliedNames();

  for (const file of files) {
    if (applied.has(file)) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const sql = raw.replace(/^﻿/, ''); // strip BOM if present
    console.log('Applying:', file);
    await db.query('BEGIN');
    try {
      await db.query(sql);
      await db.query('INSERT INTO __migrations(name) VALUES($1)', [file]);
      await db.query('COMMIT');
      console.log('Applied:', file);
    } catch (e) {
      await db.query('ROLLBACK');
      console.error('Failed:', file, e);
      process.exit(1);
    }
  }
  console.log('Migrations up complete');
}

async function down() {
  console.log('Down: dropping tables created by 001_init.sql (danger!)');
  await db.query('BEGIN');
  try {
    await db.query('DROP TABLE IF EXISTS order_items CASCADE;');
    await db.query('DROP TABLE IF EXISTS orders CASCADE;');
    await db.query('DROP TABLE IF EXISTS cart_items CASCADE;');
    await db.query('DROP TABLE IF EXISTS products CASCADE;');
    await db.query('DROP TABLE IF EXISTS users CASCADE;');
    await db.query("DELETE FROM __migrations WHERE name IN ('001_init.sql','002_fix_products_schema.sql','003_users_role.sql')");
    await db.query('COMMIT');
    console.log('Down complete');
  } catch (e) {
    await db.query('ROLLBACK');
    console.error('Down failed:', e);
    process.exit(1);
  }
}

const cmd = process.argv[2];
if (!cmd || !['up','down'].includes(cmd)) {
  console.log('Usage: node scripts/migrate.js [up|down]');
  process.exit(1);
}

(cmd === 'up' ? up : down)().then(() => process.exit(0));
