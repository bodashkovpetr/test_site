require('dotenv').config();
const db = require('../db');

(async () => {
  try {
    const email = process.argv[2];
    const role = process.argv[3] || 'admin';
    if (!email) {
      console.log('Usage: npm run admin:make -- <email> [role]');
      process.exit(1);
    }
    const { rows } = await db.query('UPDATE users SET role=$2 WHERE email=$1 RETURNING id, email, role', [email, role]);
    if (!rows.length) {
      console.log('User not found:', email);
    } else {
      console.log('Updated:', rows[0]);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
