const express = require('express');
const router = express.Router();
const {
  createClient,
  getClients,
  getClient,
  updateClient,
} = require('../controllers/client.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createClient);
router.get('/', getClients);
router.get('/:id', getClient);
router.put('/:id', updateClient);

module.exports = router;
