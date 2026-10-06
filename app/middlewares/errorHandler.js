const multer = require("multer");

// Gestionnaire d'erreurs unique : les routes lèvent une erreur, la réponse est construite ici.
module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = err.status || err.statusCode || 500;
  let message = err.message;

  if (err instanceof multer.MulterError) {
    status = 400;
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid identifier";
  } else if (err.name === "ValidationError") {
    status = 400;
  } else if (err.code === 11000) {
    status = 409;
    message = "Duplicate value";
  }

  if (status >= 500) {
    console.error(err);
    message = "Internal server error";
  }
  res.status(status).json({ message });
};
