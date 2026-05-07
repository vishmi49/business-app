const Order = require('../models/order.model');

const generateOrderNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;

  const lastOrder = await Order.findOne(
    { orderNumber: { $regex: `^${prefix}` } },
    { orderNumber: 1 },
    { sort: { orderNumber: -1 } }
  );

  if (!lastOrder) {
    return `${prefix}001`;
  }

  const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2], 10);
  const nextNumber = String(lastNumber + 1).padStart(3, '0');

  return `${prefix}${nextNumber}`;
};

module.exports = { generateOrderNumber };
