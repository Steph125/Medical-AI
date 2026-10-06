const express = require('express');

const contactSchema = require('../models/contact.model');
const { asyncHandler, pick } = require('../utils/http');

const router = express.Router();

// CREATE Contact
router.post('/create-contact', asyncHandler(async (req, res) => {
  res.json(await contactSchema.create(pick(req.body, ['name', 'phone', 'email', 'message'])));
}));

module.exports = router;
