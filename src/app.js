require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const inquiryRoutes = require('./routes/inquiry.routes');
const clientRoutes = require('./routes/client.routes');
const orderRoutes = require('./routes/order.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/clients/:id/orders', orderRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Business App API is running!', status: 'ok' });
});

app.use(errorHandler);

module.exports = app;
