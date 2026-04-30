const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Inquiry = mongoose.model('Inquiry', inquirySchema);

module.exports = Inquiry;
