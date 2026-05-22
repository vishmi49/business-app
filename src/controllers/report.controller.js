const Order = require('../models/order.model');
const Expense = require('../models/expense.model');

// ── @route   GET /api/reports/order/:orderId ─────────────────────────────────
const getOrderReport = async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate(
    'clientId',
    'name companyName'
  );

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const expenses = await Expense.find({ orderId: req.params.orderId }).sort({
    date: -1,
  });

  const totalCost =
    Math.round(expenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;

  const totalPrice =
    order.pricePerUnit && order.quantity
      ? Math.round(order.pricePerUnit * order.quantity * 100) / 100
      : null;

  const profit =
    totalPrice !== null
      ? Math.round((order.paidAmount - totalCost) * 100) / 100
      : null;

  const outstanding =
    totalPrice !== null
      ? Math.round((totalPrice - order.paidAmount) * 100) / 100
      : null;

  const expensesByCategory = expenses.reduce((acc, e) => {
    if (!acc[e.category]) acc[e.category] = 0;
    acc[e.category] = Math.round((acc[e.category] + e.amount) * 100) / 100;
    return acc;
  }, {});

  res.status(200).json({
    order,
    totalPrice,
    totalCost,
    paidAmount: order.paidAmount,
    outstanding,
    profit,
    expensesByCategory,
    expenses,
  });
};

// ── @route   GET /api/reports/summary ───────────────────────────────────────
const getSummaryReport = async (req, res) => {
  const { month, year, startDate, endDate } = req.query;

  let dateFilter = {};

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    dateFilter = { $gte: start, $lte: end };
  } else if (startDate && endDate) {
    dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59)),
    };
  } else {
    return res.status(400).json({
      message:
        'Provide either month and year (e.g. month=1&year=2026) or startDate and endDate',
    });
  }

  const expenses = await Expense.find({ date: dateFilter });
  const orders = await Order.find({ createdAt: dateFilter });

  const totalExpenses =
    Math.round(expenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;

  const totalIncome =
    Math.round(orders.reduce((sum, o) => sum + o.paidAmount, 0) * 100) / 100;

  const profit = Math.round((totalIncome - totalExpenses) * 100) / 100;

  const expensesByCategory = expenses.reduce((acc, e) => {
    if (!acc[e.category]) acc[e.category] = 0;
    acc[e.category] = Math.round((acc[e.category] + e.amount) * 100) / 100;
    return acc;
  }, {});

  res.status(200).json({
    period:
      month && year
        ? `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`
        : `${startDate} to ${endDate}`,
    totalExpenses,
    totalIncome,
    profit,
    expensesByCategory,
    orderCount: orders.length,
  });
};

module.exports = { getOrderReport, getSummaryReport };
