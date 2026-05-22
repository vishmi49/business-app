const express = require('express');
const router = express.Router();
const {
  createExpense,
  getExpenses,
  getExpensesByOrder,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createExpense);
router.get('/', getExpenses);
router.get('/order/:orderId', getExpensesByOrder);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
