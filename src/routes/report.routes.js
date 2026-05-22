const express = require('express');
const router = express.Router();
const {
  getOrderReport,
  getSummaryReport,
} = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/order/:orderId', getOrderReport);
router.get('/summary', getSummaryReport);

module.exports = router;
