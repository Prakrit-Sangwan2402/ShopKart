const express = require('express');
const router = express.Router();
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} = require('../controllers/wishlist.controller');
const { protect } = require('../middlewares/auth.middleware');

// All wishlist routes require customer authentication
router.use(protect);

router.post('/', addToWishlist);
router.post('/:productId', addToWishlist);
router.get('/', getWishlist);
router.delete('/:id', removeFromWishlist);

module.exports = router;
