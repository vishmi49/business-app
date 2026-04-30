require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const inquiryRoutes = require('./routes/inquiry.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/inquiries', inquiryRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Business App API is running!', status: 'ok' });
});

app.use(errorHandler);

module.exports = app;
