const Appointement = require("../models/appointement");
const Location = require("../models/location");
const { hasRole } = require("../middlewares/authJwt");
const { HttpError, asyncHandler, pick } = require("../utils/http");

const APPOINTMENT_FIELDS = ["Firstname", "Lastname", "Email", "Phone", "StartDate", "EndDate", "DoctorName"];

// Charge un rendez-vous et vérifie que l'utilisateur connecté y a accès.
const findOwnAppointment = async (req) => {
  const appointment = await Appointement.findById(req.params.id);
  if (!appointment) {
    throw new HttpError(404, "Appointment not found");
  }
  const isParticipant = [appointment.User, appointment.Doctor, appointment.Patient]
    .some((id) => id && id.equals(req.userId));
  if (!isParticipant && !hasRole(req.user, "admin")) {
    throw new HttpError(403, "Access denied");
  }
  return appointment;
};

const get_appointment = asyncHandler(async (req, res) => {
  const appointments = await Appointement.find({ User: req.params.id });
  res.status(200).send({ msg: "appointments", appointments });
});

const appointment_create_post = asyncHandler(async (req, res) => {
  const appointment = await Appointement.create({
    ...pick(req.body, APPOINTMENT_FIELDS),
    User: req.params.id,
  });
  res.status(201).json({ appointment: appointment });
});

const appointment_delete = asyncHandler(async (req, res) => {
  const appointment = await findOwnAppointment(req);
  await appointment.deleteOne();
  res.json();
});

const UpdateAppointement = asyncHandler(async (req, res) => {
  await findOwnAppointment(req);
  const result = await Appointement.updateOne(
    { _id: req.params.id },
    { $set: pick(req.body, APPOINTMENT_FIELDS) },
    { runValidators: true }
  );
  if (result.modifiedCount) {
    return res.send({ msg: "updated" });
  }
  res.send({ msg: "there is no modification" });
});

const get_one_appointment = asyncHandler(async (req, res) => {
  const appointment = await findOwnAppointment(req);
  res.status(200).send({ msg: "appointment", appointment });
});

// Enregistre la position et la rattache à l'utilisateur connecté.
const addlocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    throw new HttpError(400, "lat and lng must be numbers");
  }
  const loc = await Location.create({ lat: String(lat), lng: String(lng) });
  req.user.location = loc._id;
  await req.user.save();
  res.status(201).json({ location: loc });
});

module.exports = {
  appointment_create_post,
  appointment_delete,
  get_appointment,
  UpdateAppointement,
  get_one_appointment,
  addlocation
};
