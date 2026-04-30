const Inquiry = require('../models/inquiry.model');
const { sendInquiryNotification } = require('../utils/email');

// ── @route   POST /api/inquiries ─────────────────────────────────────────────
const createInquiry = async (req, res) => {
  const { name, companyName, contactNumber, email, description } = req.body;

  if (!name || !contactNumber || !email) {
    return res.status(400).json({
      message: 'Name, contact number and email are required',
    });
  }

  const inquiry = await Inquiry.create({
    name,
    companyName,
    contactNumber,
    email,
    description,
  });

  await sendInquiryNotification(inquiry);

  res.status(201).json({
    message: 'Inquiry submitted successfully',
  });
};

module.exports = { createInquiry };
