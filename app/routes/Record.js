const RecordController = require('../controllers/Record')
const { verifyToken, isDoctorOrAdmin, isSelfOr } = require('../middlewares/authJwt')
const express = require('express');

const router = express.Router();

// Dossiers médicaux : toutes les routes exigent d'être connecté.
router.use(verifyToken);

router.post('/', RecordController.record_Create_Post);
router.get('/get', isDoctorOrAdmin, RecordController.record_list);
router.put("/:id", isSelfOr('doctor', 'admin'), RecordController.record_update);
router.get("/:id", isSelfOr('doctor', 'admin'), RecordController.record_details);
router.get("/", isDoctorOrAdmin, RecordController.record_list);
router.delete("/:id", RecordController.record_delete);

module.exports = router;
