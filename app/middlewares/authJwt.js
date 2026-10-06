const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const { HttpError, asyncHandler } = require("../utils/http");

const User = db.user;

const verifyToken = asyncHandler(async (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token) {
    throw new HttpError(403, "No token provided!");
  }

  let decoded;
  try {
    decoded = jwt.verify(String(token), config.secret);
  } catch {
    throw new HttpError(401, "Unauthorized!");
  }
  // Refuse les autres jetons signés avec le même secret (confirmation d'email, etc.).
  if (!decoded.id || decoded.purpose) {
    throw new HttpError(401, "Unauthorized!");
  }

  const user = await User.findById(decoded.id).populate("roles", "-__v");
  if (!user) {
    throw new HttpError(401, "Unauthorized!");
  }
  req.userId = user.id;
  req.user = user;
  next();
});

// Le projet stocke le rôle à deux endroits : `role` (patient/doctor/admin) et `roles`
// (collection Role : user/moderator/admin). On tient compte des deux.
const roleNames = (user) =>
  new Set([user.role, ...(user.roles || []).map((role) => role.name)].filter(Boolean));

const hasRole = (user, ...allowed) => {
  const names = roleNames(user);
  return allowed.some((role) => names.has(role));
};

const requireRole = (...allowed) => (req, res, next) => {
  if (hasRole(req.user, ...allowed)) return next();
  next(new HttpError(403, `Require ${allowed.join(" or ")} Role!`));
};

// L'utilisateur ne peut agir que sur sa propre ressource (:id), sauf s'il a un des rôles listés.
const isSelfOr = (...allowed) => (req, res, next) => {
  if (req.params.id === req.userId || hasRole(req.user, ...allowed)) return next();
  next(new HttpError(403, "Access denied"));
};

module.exports = {
  verifyToken,
  hasRole,
  requireRole,
  isSelfOr,
  isAdmin: requireRole("admin"),
  isModerator: requireRole("moderator"),
  isDoctorOrAdmin: requireRole("doctor", "admin"),
};
