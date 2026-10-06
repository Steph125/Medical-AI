const mongoose = require('mongoose');

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.role = require("./role.model");
db.blog = require("./blog.model");
db.product = require("./product.model");
db.contact = require("./contact.model");
db.record = require("./Record");
db.appointment = require("./appointement");
db.location = require("./location");
db.chatbotTalks = require("./chatbotTalks");

db.ROLES = ["user", "admin", "moderator"];

module.exports = db;
