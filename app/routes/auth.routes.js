const rateLimit = require("express-rate-limit");
const { verifySignUp } = require("../middlewares");
const controller = require("../controllers/auth.controller");

// Limite les tentatives (force brute sur les mots de passe, spam d'emails).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later." },
});

module.exports = function(app) {
  app.post(
    "/api/auth/signup",
    authLimiter,
    verifySignUp.checkDuplicateUsernameOrEmail,
    controller.signup
  );

  app.post("/api/auth/signin", authLimiter, controller.signin);
  // La connexion LinkedIn passe désormais par /oauth (vérification auprès de LinkedIn).
  // Les routes /signinlinkedin et /signinface ont été supprimées : elles donnaient
  // un jeton à quiconque fournissait un email ou un nom d'utilisateur, sans mot de passe.

  app.get("/api/auth/confirm/:confirmationCode", controller.verifyUser);
  app.post("/api/auth/forgot", authLimiter, controller.resetPassword);
  app.post("/api/auth/reset-password", authLimiter, controller.confirmResetPassword);
};
