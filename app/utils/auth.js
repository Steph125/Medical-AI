const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");

const signAccessToken = (user) =>
  jwt.sign({ id: user.id }, config.secret, { expiresIn: 86400 }); // 24 heures

// Réponse de connexion attendue par le front (format identique à l'ancien /signin).
// `user.roles` doit être peuplé.
const buildAuthResponse = (user) => ({
  id: user._id,
  role: user.role,
  username: user.username,
  email: user.email,
  roles: (user.roles || []).map((role) => "ROLE_" + role.name.toUpperCase()),
  accessToken: signAccessToken(user),
  status: user.status,
});

// Le jeton de réinitialisation est signé avec le hash du mot de passe actuel :
// il devient invalide dès que le mot de passe a changé (usage unique).
const resetSecret = (user) => config.secret + user.password;

const signResetToken = (user) =>
  jwt.sign({ id: user.id, purpose: "reset" }, resetSecret(user), { expiresIn: "1h" });

const verifyResetToken = async (User, token) => {
  const decoded = jwt.decode(String(token));
  if (!decoded || decoded.purpose !== "reset" || !decoded.id) return null;
  const user = await User.findById(decoded.id);
  if (!user) return null;
  try {
    jwt.verify(String(token), resetSecret(user));
    return user;
  } catch {
    return null;
  }
};

module.exports = { signAccessToken, buildAuthResponse, signResetToken, verifyResetToken };
