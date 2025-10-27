// C:\apps\yourstyle-backend\routes\products.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productsController');

// GET /api/products
router.get('/', ctrl.getAllProducts);

// GET /api/products/:id
router.get('/:id', ctrl.getProductById);

module.exports = router;