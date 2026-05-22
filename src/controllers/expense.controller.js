const Expense = require('../models/expense.model');
const Order = require('../models/order.model');

// ── @route   POST /api/expenses ──────────────────────────────────────────────
const createExpense = async (req, res) => {
  const { orderId, category, amount, description, date } = req.body;

  if (!orderId || !category || !amount || !date) {
    return res.status(400).json({
      message: 'Order, category, amount and date are required',
    });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const expense = await Expense.create({
    orderId,
    category,
    amount: Math.round(amount * 100) / 100,
    description,
    date,
  });

  res.status(201).json({ message: 'Expense created successfully', expense });
};

// ── @route   GET /api/expenses ───────────────────────────────────────────────
const getExpenses = async (req, res) => {
  const { category, startDate, endDate } = req.query;

  const filter = {};

  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const expenses = await Expense.find(filter)
    .populate('orderId', 'orderNumber clientId')
    .sort({ date: -1 });

  res.status(200).json({ count: expenses.length, expenses });
};

// ── @route   GET /api/expenses/order/:orderId ────────────────────────────────
const getExpensesByOrder = async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const expenses = await Expense.find({ orderId: req.params.orderId }).sort({
    date: -1,
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCost = Math.round(total * 100) / 100;

  res.status(200).json({ count: expenses.length, totalCost, expenses });
};

// ── @route   PUT /api/expenses/:id ───────────────────────────────────────────
const updateExpense = async (req, res) => {
  const { category, amount, description, date } = req.body;

  const updateData = { category, description, date };
  if (amount !== undefined) {
    updateData.amount = Math.round(amount * 100) / 100;
  }

  const expense = await Expense.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!expense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  res.status(200).json({ message: 'Expense updated successfully', expense });
};

// ── @route   DELETE /api/expenses/:id ────────────────────────────────────────
const deleteExpense = async (req, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);

  if (!expense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  res.status(200).json({ message: 'Expense deleted successfully' });
};

module.exports = {
  createExpense,
  getExpenses,
  getExpensesByOrder,
  updateExpense,
  deleteExpense,
};
