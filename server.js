require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Business App API is running!', status: 'ok' });
});

app.listen(PORT, () => [
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`
  ),
]);
