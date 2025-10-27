const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('../db');

(async () => {
  try {
    const list = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'seeds', 'products.json'), 'utf8'));
    await db.query('BEGIN');
    for (const p of list) {
      // ??????? ??????? UPDATE (???? ?????? ??? ????)
      const upd = await db.query(
        `UPDATE products
           SET name=$2, description=$3, category=$4, price=$5, image_url=$6, updated_at=NOW()
         WHERE id=$1`,
        [p.id, p.name, p.description || '', p.category, p.price, p.image_url || '']
      );
      if (upd.rowCount === 0) {
        // ???? ?????? ?? ???? — ???????
        await db.query(
          `INSERT INTO products (id, name, description, category, price, image_url, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
          [p.id, p.name, p.description || '', p.category, p.price, p.image_url || '']
        );
      }
    }
    await db.query('COMMIT');
    console.log('Backfilled from seed:', list.length);
  } catch (e) {
    await db.query('ROLLBACK').catch(()=>{});
    console.error('Backfill failed:', e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();