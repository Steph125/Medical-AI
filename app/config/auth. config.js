require('dotenv').config();

module.exports = {
    secret: process.env.SECRET_KEY || "default-secret-key", // Utiliser une valeur par défaut si la variable d'environnement n'est pas définie
    user: process.env.USER_EMAIL || "default-email@example.com",
    pass: process.env.USER_PASS || "default-password",
};
