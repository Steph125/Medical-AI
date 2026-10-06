const express = require('express');
const { symptomChatbot } = require('../services/dialogflow');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

// Chatbot de symptômes (public). Le client peut envoyer un sessionId pour garder le
// contexte de sa conversation ; à défaut, on utilise son adresse IP.
router.post('/', asyncHandler(async (req, res) => {
  const message = String(req.body.message || '');
  const sessionId = req.body.sessionId || req.ip;
  try {
    res.send({ message: await symptomChatbot(sessionId, message) });
  } catch (error) {
    console.error('Dialogflow error:', error.message);
    res.status(502).send({ error: 'Error occured here' });
  }
}));

module.exports = router;
