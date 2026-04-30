const express = require('express');
const router = express.Router();
const { createInquiry } = require('../controllers/inquiry.controller');

router.post('/', createInquiry);

module.exports = router;
