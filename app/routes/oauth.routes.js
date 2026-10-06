const express = require('express');

const config = require('../config/auth.config');
const User = require('../models/user.model');
const { HttpError, asyncHandler } = require('../utils/http');
const { buildAuthResponse } = require('../utils/auth');

const router = express.Router();

const requestAccessToken = async (code) => {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:8080/oauth',
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    }),
  });
  if (!response.ok) throw new HttpError(502, 'LinkedIn token exchange failed');
  return (await response.json()).access_token;
};

const requestEmail = async (token) => {
  const response = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new HttpError(502, 'LinkedIn profile request failed');
  return response.json();
};

/* Callback OAuth LinkedIn : l'email est vérifié auprès de LinkedIn,
   puis le serveur renvoie lui-même le jeton de connexion au front. */
router.get('/', asyncHandler(async (req, res) => {
  if (!req.query.code) throw new HttpError(400, 'Missing authorization code');

  const profile = await requestEmail(await requestAccessToken(req.query.code));
  const email = profile?.elements?.[0]?.['handle~']?.emailAddress;
  const user = email ? await User.findOne({ email }).populate('roles', '-__v') : null;

  res.render('callback', {
    profile,
    // null si aucun compte actif ne correspond à cet email
    auth: user && user.status === 'Active' ? buildAuthResponse(user) : null,
    // Renvoyé tel quel pour que le front vérifie qu'il correspond à celui qu'il a envoyé (anti-CSRF)
    state: req.query.state || null,
    targetOrigin: config.frontendUrl,
  });
}));

module.exports = router;
