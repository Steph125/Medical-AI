const db = require("../models");
const { HttpError, asyncHandler } = require("../utils/http");

const User = db.user;

const checkDuplicateUsernameOrEmail = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    throw new HttpError(400, "Failed! Username, email and password are required!");
  }
  if (String(password).length < 8) {
    throw new HttpError(400, "Failed! Password must contain at least 8 characters!");
  }
  if (await User.exists({ username: String(username) })) {
    throw new HttpError(400, "Failed! Username is already in use!");
  }
  if (await User.exists({ email: String(email) })) {
    throw new HttpError(400, "Failed! Email is already in use!");
  }
  next();
});

module.exports = { checkDuplicateUsernameOrEmail };
