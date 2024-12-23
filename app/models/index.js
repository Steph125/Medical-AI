const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.role = require("./role.model");
db.blog = require("./blog.model"); // Blog model
db.product = require("./product.model");
db.contact = require("./contact.model"); // Correctly assigning the contact model

db.ROLES = ["user", "admin", "moderator"];

module.exports = db;
