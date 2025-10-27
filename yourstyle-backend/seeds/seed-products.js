const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function seedProducts() {
  try {
    console.log('Starting product seeding...');
    
    const productsFile = path.join(__dirname, 'products.json');
    const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    
    console.log(`Found ${products.length} products to seed`);
    
    for (const product of products) {
      const query = `
        INSERT INTO products (id, name, category, price_cents, image_url, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          price_cents = EXCLUDED.price_cents,
          image_url = EXCLUDED.image_url,
          description = EXCLUDED.description
      `;
      
      await db.query(query, [
        product.id,
        product.name,
        product.category,
        product.price_cents,
        product.image_url || '',
        product.description || ''
      ]);
      
      console.log(`✓ Seeded product: ${product.name}`);
    }
    
    console.log('✓ Product seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  }
}

seedProducts();
