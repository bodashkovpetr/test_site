const db = require('../config/database');
const { body, validationResult } = require('express-validator');

const addToCartValidation = [
  body('product_id').notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

const updateCartValidation = [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

async function getCart(req, res) {
  try {
    const userId = req.user.userId;
    
    const result = await db.query(
      `SELECT 
        c.id,
        c.product_id,
        c.quantity,
        p.name,
        p.category,
        p.price_cents,
        p.image_url,
        p.description,
        (c.quantity * p.price_cents) as line_total_cents
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC`,
      [userId]
    );
    
    const totalCents = result.rows.reduce((sum, item) => sum + item.line_total_cents, 0);
    
    res.json({
      success: true,
      data: {
        items: result.rows,
        total_cents: totalCents,
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch cart' 
    });
  }
}

async function addToCart(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const userId = req.user.userId;
    const { product_id, quantity } = req.body;
    
    const productCheck = await db.query(
      'SELECT id FROM products WHERE id = $1',
      [product_id]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }
    
    const existingItem = await db.query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );
    
    let result;
    if (existingItem.rows.length > 0) {
      const newQuantity = existingItem.rows[0].quantity + quantity;
      result = await db.query(
        `UPDATE cart 
         SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, product_id, quantity`,
        [newQuantity, existingItem.rows[0].id]
      );
    } else {
      result = await db.query(
        `INSERT INTO cart (user_id, product_id, quantity) 
         VALUES ($1, $2, $3) 
         RETURNING id, product_id, quantity`,
        [userId, product_id, quantity]
      );
    }
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add item to cart' 
    });
  }
}

async function updateCart(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const userId = req.user.userId;
    const { id } = req.params;
    const { quantity } = req.body;
    
    const result = await db.query(
      `UPDATE cart 
       SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_id = $3 
       RETURNING id, product_id, quantity`,
      [quantity, id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cart item not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update cart item' 
    });
  }
}

async function deleteFromCart(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cart item not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Delete from cart error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove item from cart' 
    });
  }
}


async function deleteByProduct(req, res) {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const result = await db.query(
      'DELETE FROM cart WHERE user_id = $1 AND product_id = $2 RETURNING id',
      [userId, productId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cart item not found' });
    }
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Delete from cart by product error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove item from cart' });
  }
}
module.exports = {
  getCart,
  addToCart,
  updateCart,
  deleteFromCart,
  deleteByProduct,
  addToCartValidation,
  updateCartValidation,
};
