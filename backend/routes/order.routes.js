const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
} = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');

// All order endpoints require customer authentication
router.use(protect);

router.post('/', createOrder);
router.post('/:id/verify-payment', verifyPayment);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);

module.exports = router;
