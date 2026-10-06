const path = require("path");
const multer = require("multer");
const { randomUUID } = require("crypto");
const { HttpError } = require("../utils/http");

const PUBLIC_DIR = path.join(__dirname, "../../public");
const EXTENSIONS = { "image/png": ".png", "image/jpeg": ".jpg", "image/jpg": ".jpg" };

// Le nom du fichier est généré côté serveur : le nom envoyé par le client
// (qui peut contenir "../") n'est jamais utilisé.
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PUBLIC_DIR),
    filename: (req, file, cb) => cb(null, randomUUID() + EXTENSIONS[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (EXTENSIONS[file.mimetype]) return cb(null, true);
    cb(new HttpError(400, "Only .png, .jpg and .jpeg format allowed!"));
  },
});

const requireFile = (req, res, next) => {
  if (!req.file) return next(new HttpError(400, "An image file is required (field 'profileImg')."));
  next();
};

const publicUrl = (req, file) => `${req.protocol}://${req.get("host")}/public/${file.filename}`;

module.exports = { upload, requireFile, publicUrl };
