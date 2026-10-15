const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
} = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');

// All cart routes require customer authentication
router.use(protect);

router.post('/', addToCart);
router.post('/:productId', addToCart);
router.get('/', getCart);
router.put('/:itemId', updateCartItemQuantity);
router.patch('/:itemId', updateCartItemQuantity);
router.delete('/', clearCart);
router.delete('/:itemId', removeFromCart);

module.exports = router;
