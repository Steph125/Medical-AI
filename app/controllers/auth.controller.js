const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const config = require("../config/auth.config");
const nodemailer = require("../config/nodemailer.config");
const db = require("../models");
const { HttpError, asyncHandler } = require("../utils/http");
const { buildAuthResponse, signResetToken, verifyResetToken } = require("../utils/auth");

const User = db.user;
const Role = db.role;

// Rôles qu'un visiteur peut choisir à l'inscription (jamais "admin").
const SIGNUP_ROLES = ["patient", "doctor"];

exports.signup = asyncHandler(async (req, res) => {
  const { firstname, lastname, phone, birthdate } = req.body;
  const username = String(req.body.username);
  const email = String(req.body.email);

  const userRole = await Role.findOne({ name: "user" });
  const user = await User.create({
    username,
    firstname,
    lastname,
    phone,
    birthdate,
    email,
    role: SIGNUP_ROLES.includes(req.body.role) ? req.body.role : "patient",
    password: bcrypt.hashSync(String(req.body.password), 8),
    confirmationCode: jwt.sign({ email, purpose: "confirm" }, config.secret),
    roles: userRole ? [userRole._id] : [],
  });

  res.send({ message: "User was registered successfully! Please check your email" });
  nodemailer.sendConfirmationEmail(user.username, user.email, user.confirmationCode);
});

exports.signin = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: String(req.body.username) }).populate("roles", "-__v");

  // Même message si l'utilisateur n'existe pas ou si le mot de passe est faux :
  // on ne révèle pas quels comptes existent.
  if (!user || !bcrypt.compareSync(String(req.body.password), user.password)) {
    return res.status(401).send({ accessToken: null, message: "Invalid username or password!" });
  }

  if (user.status != "Active") {
    return res.status(401).send({ message: "Pending Account. Please Verify Your Email!" });
  }

  res.status(200).send(buildAuthResponse(user));
});

exports.verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ confirmationCode: String(req.params.confirmationCode) });
  if (!user) {
    throw new HttpError(404, "User Not found.");
  }
  user.status = "Active";
  await user.save();
  res.send({ message: "Account verified successfully!" });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email) });
  if (user) {
    nodemailer.sendResetPasswordEmail(user.username, user.email, signResetToken(user));
  }
  // Réponse identique que l'email existe ou non.
  res.status(200).send({ message: "If this email exists, a mail was sent! Please check your email" });
});

exports.confirmResetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!password || String(password).length < 8) {
    throw new HttpError(400, "Password must contain at least 8 characters!");
  }
  const user = await verifyResetToken(User, token);
  if (!user) {
    throw new HttpError(400, "Invalid or expired reset link.");
  }
  user.password = bcrypt.hashSync(String(password), 8);
  await user.save();
  res.send({ message: "Password updated successfully!" });
});
