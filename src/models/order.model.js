const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    sizes: {
      S: { type: Number, default: 0 },
      M: { type: Number, default: 0 },
      L: { type: Number, default: 0 },
      XL: { type: Number, default: 0 },
      XXL: { type: Number, default: 0 },
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          'pending',
          'confirmed',
          'in-production',
          'quality-check',
          'completed',
          'delivered',
        ],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    deadline: {
      type: Date,
    },
    pricePerUnit: {
      type: Number,
      min: [0, 'Price per unit cannot be negative'],
    },

    qualityFailureCount: {
      type: Number,
      default: 0,
      min: [0, 'Quality failure count cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['unpaid', 'partially-paid', 'fully-paid'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'unpaid',
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
