const nodemailer = require("nodemailer");
const config = require("./auth.config");
const { escapeHtml } = require("../utils/http");

const transport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: config.user,
    pass: config.pass,
  },
});

// Les emails sont envoyés en arrière-plan : un échec est journalisé sans bloquer la requête.
const send = (to, subject, html) =>
  transport
    .sendMail({ from: config.user, to, subject, html })
    .catch((err) => console.error(`Échec d'envoi d'email à ${to} :`, err.message));

module.exports.sendConfirmationEmail = (name, email, confirmationCode) =>
  send(
    email,
    "Please confirm your account",
    `<h1>Email Confirmation</h1>
        <h2>Hello ${escapeHtml(name)}</h2>
        <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
        <a href="${config.frontendUrl}/confirm/${encodeURIComponent(confirmationCode)}">Click here</a>`
  );

module.exports.sendResetPasswordEmail = (name, email, resetToken) =>
  send(
    email,
    "[NearestDoctor] Please reset your password",
    `<h1>Reset your account's password</h1>
        <h2>Hello ${escapeHtml(name)}</h2>
        <p>We heard that you lost your password. Sorry about that!<br>
        But don't worry! You can use the following link to reset your password (valid for 1 hour):</p>
        <a href="${config.frontendUrl}/resetPassword/${encodeURIComponent(resetToken)}">Click here</a>`
  );

module.exports.sendAppointementMail = (docname, doclastname, StartDate, docphone, Email) =>
  send(
    Email,
    "[NearestDoctor] Appointement Confirmation",
    `<h1>Get Your Appointement Details</h1>
        <p>You have an appointment with ${escapeHtml(docname)} ${escapeHtml(doclastname)}
        at ${escapeHtml(new Date(StartDate).toUTCString())}.
        If you want to cancel the appointment call this number: ${escapeHtml(docphone)}</p>`
  );
