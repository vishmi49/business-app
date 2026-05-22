const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  updateOrderStatus,
  recordQualityFailure,
  getOrdersByClient,
  updatePayment,
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.put('/:id', updateOrder);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/quality-failure', recordQualityFailure);
router.patch('/:id/payment', updatePayment);

// This handles GET /api/clients/:id/orders
router.get('/client/:id/orders', getOrdersByClient);

module.exports = router;
