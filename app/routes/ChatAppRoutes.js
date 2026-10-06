const express = require('express');
const ChatAppController = require("../controllers/chatapp.controller");
const { verifyToken, isSelfOr } = require('../middlewares/authJwt');

const router = express.Router();

// Un utilisateur n'accède qu'à sa propre conversation.
router.use(verifyToken);

router.post('/send/:id', isSelfOr(), ChatAppController.send_message);
router.get('/get/:id', isSelfOr('admin'), ChatAppController.get_messages);
router.delete("/delete/:id", isSelfOr('admin'), ChatAppController.delete_messages);

module.exports = router;
