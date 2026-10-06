const express = require('express');
const webmd = require('../services/webmd');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.get('/depression', asyncHandler(async (req, res) => {
  res.json(await webmd.searchArticles('depression'));
}));

module.exports = router;
