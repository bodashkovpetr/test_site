const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { 
  getCart, 
  addToCart, 
  updateCart, 
  deleteFromCart,
  deleteByProduct,
  addToCartValidation,
  updateCartValidation
} = require('../controllers/cartController');

router.use(authenticate);

router.get('/', getCart);
router.post('/', addToCartValidation, addToCart);
router.put('/:id', updateCartValidation, updateCart);
router.delete('/:id', deleteFromCart);
router.delete('/by-product/:productId', deleteByProduct);

module.exports = router;
