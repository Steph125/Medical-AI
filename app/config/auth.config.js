require("dotenv").config();

if (!process.env.SECRET_KEY) {
  throw new Error("SECRET_KEY manquant : définissez-le dans le fichier .env (voir .env.example)");
}

module.exports = {
  secret: process.env.SECRET_KEY,
  user: process.env.USER_EMAIL,
  pass: process.env.USER_PASS,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:8081",
};
