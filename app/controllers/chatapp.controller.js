const geolib = require('geolib');
const moment = require('moment');

const { appointmentChatbot } = require('../services/dialogflow');
const ChatTalks = require("../models/chatbotTalks");
const UserModel = require("../models/user.model");
const Appointment = require('../models/appointement');
const nodemailer = require("../config/nodemailer.config");
const { HttpError, asyncHandler, escapeRegex } = require('../utils/http');

const APPOINTMENT_DURATION_MINUTES = 30;

// Spécialité demandée : paramètre extrait par Dialogflow, sinon le texte brut.
const getSpeciality = (response) => {
  const field = response.parameters?.fields?.Doctor_speciality;
  const value = field?.stringValue || field?.listValue?.values?.[0]?.stringValue || response.queryText;
  return String(value || "").trim();
};

// Parcourt tous les médecins de la spécialité et garde le plus proche.
const findNearestDoctor = async (speciality, userLat, userLng) => {
  const doctors = await UserModel.find({
    speciality: new RegExp(`^${escapeRegex(speciality)}$`, "i"),
    location: { $ne: null },
  }).populate("location");

  let nearest = null;
  let nearestDistance = Infinity;
  for (const doctor of doctors) {
    if (!doctor.location) continue;
    const distance = geolib.getDistance(
      { latitude: userLat, longitude: userLng },
      { latitude: Number(doctor.location.lat), longitude: Number(doctor.location.lng) }
    );
    if (distance < nearestDistance) {
      nearest = doctor;
      nearestDistance = distance;
    }
  }
  return nearest;
};

const chooseDoctor = async (response, body) => {
  const lat = Number(body.Userlat);
  const lng = Number(body.Userlng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { messageReceived: "Please enable location access so we can find the nearest doctor." };
  }
  const doctor = await findNearestDoctor(getSpeciality(response), lat, lng);
  if (!doctor) {
    return { messageReceived: "Sorry, no doctor with this speciality was found." };
  }
  return {
    nearestdoctor: doctor.id,
    messageReceived: `The nearest doctor to your location is ${doctor.firstname} ${doctor.lastname}, please pick a date by the datepicker.`,
  };
};

const bookAppointment = async (patient, requestedDate) => {
  // Le médecin choisi est relu dans l'historique de CET utilisateur
  // (auparavant il était stocké dans une variable partagée par tous les utilisateurs).
  const lastChoice = await ChatTalks.findOne({ user: patient._id, nearestdoctor: { $ne: null } }).sort({ date: -1 });
  const doctor = lastChoice && await UserModel.findById(lastChoice.nearestdoctor);
  if (!doctor) {
    return "please choose a doctor before picking a date";
  }

  const StartDate = new Date(requestedDate);
  if (Number.isNaN(StartDate.getTime())) {
    return "Please pick a valid date with the datepicker.";
  }
  if (StartDate < new Date()) {
    return "Please pick a date in the future.";
  }
  const EndDate = moment(StartDate).add(APPOINTMENT_DURATION_MINUTES, 'minutes').toDate();

  // Créneau indisponible s'il chevauche un rendez-vous existant du médecin.
  const conflict = await Appointment.exists({
    User: doctor._id,
    StartDate: { $lt: EndDate },
    EndDate: { $gt: StartDate },
  });
  if (conflict) {
    return "Date unavailable please pick another date";
  }

  const details = {
    Firstname: patient.firstname,
    Lastname: patient.lastname,
    Email: patient.email,
    Phone: patient.phone,
    StartDate,
    EndDate,
    DoctorName: `${doctor.firstname} ${doctor.lastname}`,
    Doctor: doctor._id,
    Patient: patient._id,
  };
  // Une copie pour le médecin, une pour le patient (format attendu par le front).
  await Appointment.insertMany([
    { ...details, User: doctor._id },
    { ...details, User: patient._id },
  ]);
  nodemailer.sendAppointementMail(doctor.firstname, doctor.lastname, StartDate, doctor.phone, patient.email);
  return `Appointment confirmed on ${StartDate.toUTCString()}, you will get an email with all details, and you can always cancel your appointment.`;
};

const send_message = asyncHandler(async (req, res) => {
  const user = req.params.id;
  const messageSent = String(req.body.message || "");
  if (!messageSent) {
    throw new HttpError(400, "message is required");
  }

  let response;
  try {
    response = await appointmentChatbot(user, messageSent);
  } catch (error) {
    console.error('Dialogflow error:', error.message);
    return res.status(502).send({ error: 'Error occured here' });
  }

  const talk = { messageSent, messageReceived: response.fulfillmentText, date: new Date(), user };
  const intent = response.intent?.displayName;

  if (intent === "Take_appointment_phase1" && response.allRequiredParamsPresent) {
    Object.assign(talk, await chooseDoctor(response, req.body));
  } else if (intent === "Take_appointment_phase2") {
    talk.messageReceived = await bookAppointment(req.user, req.body.Date);
  }

  await ChatTalks.create(talk);
  res.send({ message: response, reply: talk.messageReceived });
});

const get_messages = asyncHandler(async (req, res) => {
  const talks = await ChatTalks.find({ user: req.params.id }).sort({ date: 1 });
  res.status(200).send({ msg: "talks", talks });
});

const delete_messages = asyncHandler(async (req, res) => {
  await ChatTalks.deleteMany({ user: req.params.id });
  res.json();
});

module.exports = {
    send_message,
    get_messages,
    delete_messages
};
