const Client = require('../models/client.model');
const Order = require('../models/order.model');

// ── @route   POST /api/clients ───────────────────────────────────────────────
const createClient = async (req, res) => {
  const { name, companyName, contactNumber, email } = req.body;

  if (!name || !companyName || !contactNumber || !email) {
    return res.status(400).json({
      message: 'Name, company name, contact number and email are required',
    });
  }

  const client = await Client.create({
    name,
    companyName,
    contactNumber,
    email,
  });

  res.status(201).json({ message: 'Client created successfully', client });
};

// ── @route   GET /api/clients ────────────────────────────────────────────────
const getClients = async (req, res) => {
  const clients = await Client.find().sort({ createdAt: -1 });

  res.status(200).json({ count: clients.length, clients });
};

// ── @route   GET /api/clients/:id ────────────────────────────────────────────
const getClient = async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }

  const orders = await Order.find({ clientId: req.params.id }).sort({
    createdAt: -1,
  });

  res.status(200).json({ client, orders });
};

// ── @route   PUT /api/clients/:id ────────────────────────────────────────────
const updateClient = async (req, res) => {
  const { name, companyName, contactNumber, email } = req.body;

  const client = await Client.findByIdAndUpdate(
    req.params.id,
    { name, companyName, contactNumber, email },
    { new: true, runValidators: true }
  );

  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }

  res.status(200).json({ message: 'Client updated successfully', client });
};

module.exports = { createClient, getClients, getClient, updateClient };
