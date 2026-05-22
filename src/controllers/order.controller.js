const Order = require('../models/order.model');
const Client = require('../models/client.model');
const { generateOrderNumber } = require('../utils/orderNumber');

// ── Status pipeline definition ───────────────────────────────────────────────
const STATUS_PIPELINE = [
  'pending',
  'confirmed',
  'in-production',
  'quality-check',
  'completed',
  'delivered',
];

// ── @route   POST /api/orders ────────────────────────────────────────────────
const createOrder = async (req, res) => {
  const {
    clientId,
    quantity,
    sizes,
    description,
    deadline,
    pricePerUnit,
    notes,
  } = req.body;

  if (!clientId || !quantity) {
    return res.status(400).json({
      message: 'Client and quantity are required',
    });
  }

  const client = await Client.findById(clientId);
  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }

  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    clientId,
    quantity,
    sizes,
    description,
    deadline,
    pricePerUnit,
    notes,
  });

  res.status(201).json({ message: 'Order created successfully', order });
};

// ── @route   GET /api/orders ─────────────────────────────────────────────────
const getOrders = async (req, res) => {
  const { status, orderNumber, deadline, startDate, endDate, clientName } =
    req.query;

  const filter = {};

  if (status) filter.status = status;
  if (orderNumber) filter.orderNumber = { $regex: orderNumber, $options: 'i' };
  if (deadline) filter.deadline = new Date(deadline);
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (clientName) {
    const clients = await Client.find({
      $or: [
        { name: { $regex: clientName, $options: 'i' } },
        { companyName: { $regex: clientName, $options: 'i' } },
      ],
    }).select('_id');

    const clientIds = clients.map((c) => c._id);
    filter.clientId = { $in: clientIds };
  }

  const orders = await Order.find(filter)
    .populate('clientId', 'name companyName email')
    .sort({ createdAt: -1 });

  res.status(200).json({ count: orders.length, orders });
};

// ── @route   GET /api/orders/:id ─────────────────────────────────────────────
const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'clientId',
    'name companyName email contactNumber'
  );

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const totalPrice =
    order.pricePerUnit && order.quantity
      ? order.pricePerUnit * order.quantity
      : null;

  res.status(200).json({ order, totalPrice });
};

// ── @route   PUT /api/orders/:id ─────────────────────────────────────────────
const updateOrder = async (req, res) => {
  const { quantity, sizes, description, deadline, pricePerUnit, notes } =
    req.body;

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { quantity, sizes, description, deadline, pricePerUnit, notes },
    { new: true, runValidators: true }
  );

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.status(200).json({ message: 'Order updated successfully', order });
};

// ── @route   PATCH /api/orders/:id/status ────────────────────────────────────
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const currentIndex = STATUS_PIPELINE.indexOf(order.status);
  const newIndex = STATUS_PIPELINE.indexOf(status);

  if (newIndex === -1) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  if (newIndex !== currentIndex + 1) {
    return res.status(400).json({
      message: `Cannot transition from '${order.status}' to '${status}'. Expected next status: '${STATUS_PIPELINE[currentIndex + 1]}'`,
    });
  }

  order.status = status;
  await order.save();

  res.status(200).json({ message: 'Order status updated successfully', order });
};

// ── @route   PATCH /api/orders/:id/quality-failure ───────────────────────────
const recordQualityFailure = async (req, res) => {
  const { failureCount } = req.body;

  if (failureCount === undefined || failureCount === null) {
    return res.status(400).json({ message: 'Failure count is required' });
  }

  if (failureCount < 0) {
    return res.status(400).json({
      message: 'Failure count cannot be negative',
    });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  order.qualityFailureCount = failureCount;
  await order.save();

  res.status(200).json({
    message:
      failureCount > 0
        ? `Quality failure recorded. ${failureCount} item(s) failed.`
        : 'Quality check passed with no failures.',
    order,
  });
};

// ── @route   GET /api/clients/:id/orders ─────────────────────────────────────
const getOrdersByClient = async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }

  const orders = await Order.find({ clientId: req.params.id }).sort({
    createdAt: -1,
  });

  res.status(200).json({ count: orders.length, orders });
};

// ── @route   PATCH /api/orders/:id/payment ───────────────────────────────────
const updatePayment = async (req, res) => {
  const { paidAmount } = req.body;

  if (paidAmount === undefined || paidAmount === null) {
    return res.status(400).json({ message: 'Paid amount is required' });
  }

  if (paidAmount < 0) {
    return res.status(400).json({ message: 'Paid amount cannot be negative' });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (!order.pricePerUnit) {
    return res.status(400).json({
      message: 'Price per unit must be set before recording a payment',
    });
  }

  const totalPrice = order.quantity * order.pricePerUnit;

  let paymentStatus;
  if (paidAmount <= 0) {
    paymentStatus = 'unpaid';
  } else if (paidAmount >= totalPrice) {
    paymentStatus = 'fully-paid';
  } else {
    paymentStatus = 'partially-paid';
  }

  order.paidAmount = paidAmount;
  order.paymentStatus = paymentStatus;
  await order.save();

  res.status(200).json({
    message: 'Payment updated successfully',
    order,
    totalPrice,
    outstanding: Math.round((totalPrice - paidAmount) * 100) / 100,
  });
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  updateOrderStatus,
  recordQualityFailure,
  getOrdersByClient,
  updatePayment,
};
