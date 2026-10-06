const express = require('express');
const appointmentcontroller = require("../controllers/appointment.controller");
const { verifyToken, isSelfOr } = require('../middlewares/authJwt');

const router = express.Router();

router.use(verifyToken);

// Doit être déclarée avant "/:id", sinon "postlocation" est pris pour un id.
router.post("/postlocation", appointmentcontroller.addlocation);

router.get("/getAll/:id", isSelfOr('admin'), appointmentcontroller.get_appointment);
router.get("/:id", appointmentcontroller.get_one_appointment);
router.post("/:id", isSelfOr('admin'), appointmentcontroller.appointment_create_post);
router.delete("/delete/:id", appointmentcontroller.appointment_delete);
router.put("/:id", appointmentcontroller.UpdateAppointement);

module.exports = router;
