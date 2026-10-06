class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Express 4 ne transmet pas les rejets de promesses à next() : on le fait ici.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Ne garde que les champs autorisés (évite qu'un client modifie role, password, etc.).
const pick = (obj, keys) =>
  Object.fromEntries(
    keys.filter((key) => obj && obj[key] !== undefined).map((key) => [key, obj[key]])
  );

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const escapeHtml = (text) =>
  String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

module.exports = { HttpError, asyncHandler, pick, escapeRegex, escapeHtml };
