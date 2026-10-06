const express = require('express');
const bcrypt = require('bcryptjs');

const userSchema = require('../models/user.model');
const { verifyToken, isAdmin, isSelfOr, hasRole } = require('../middlewares/authJwt');
const { upload, requireFile, publicUrl } = require('../middlewares/upload');
const { HttpError, asyncHandler, pick } = require('../utils/http');
const { verifyResetToken } = require('../utils/auth');

const router = express.Router();

// Champs qu'un utilisateur peut modifier sur son propre profil.
const PROFILE_FIELDS = [
    'username', 'firstname', 'lastname', 'birthdate', 'gender', 'phone',
    'country', 'stat', 'street', 'zip', 'picture', 'speciality', 'location',
];
// Champs supplémentaires réservés à l'administrateur.
const ADMIN_FIELDS = [
    ...PROFILE_FIELDS, 'email', 'role', 'status', 'roles',
    'paymentDate', 'paymentPlan', 'isPaid', 'isExpired',
];

const findUserOr404 = async (query) => {
    const user = await query;
    if (!user) throw new HttpError(404, 'User Not found.');
    return user;
};

router.put('/user-profile/:id', verifyToken, isSelfOr('admin'), upload.single('profileImg'), requireFile,
    asyncHandler(async (req, res) => {
        const user = await findUserOr404(userSchema.findByIdAndUpdate(
            req.params.id,
            { $set: { picture: publicUrl(req, req.file) } },
            { new: true }
        ));
        res.json(user);
    }));

// CREATE User (admin)
router.post('/create-user', verifyToken, isAdmin, asyncHandler(async (req, res) => {
    const data = pick(req.body, ADMIN_FIELDS);
    if (req.body.password) data.password = bcrypt.hashSync(String(req.body.password), 8);
    res.json(await userSchema.create(data));
}));

// READ Users (admin)
router.get('/', verifyToken, isAdmin, asyncHandler(async (req, res) => {
    res.json(await userSchema.find());
}));

// Get Single User ID : soi-même, un médecin (profil public), ou si on est médecin/admin
router.get('/user/:id', verifyToken, asyncHandler(async (req, res) => {
    const user = await findUserOr404(userSchema.findById(req.params.id));
    const allowed = req.params.id === req.userId
        || user.role === 'doctor'
        || hasRole(req.user, 'doctor', 'admin');
    if (!allowed) throw new HttpError(403, 'Access denied');
    res.json(user);
}));

// Vérifie un lien de réinitialisation et renvoie l'utilisateur concerné.
// Le nouveau mot de passe s'envoie ensuite à POST /api/auth/reset-password.
router.get('/resetPass/:token', asyncHandler(async (req, res) => {
    const user = await verifyResetToken(userSchema, req.params.token);
    if (!user) throw new HttpError(400, 'Invalid or expired reset link.');
    res.json({ _id: user._id, username: user.username, email: user.email });
}));

// Update User : son propre profil, ou n'importe lequel pour l'admin
router.put('/update-user/:id', verifyToken, isSelfOr('admin'), asyncHandler(async (req, res) => {
    const fields = hasRole(req.user, 'admin') ? ADMIN_FIELDS : PROFILE_FIELDS;
    const user = await findUserOr404(userSchema.findByIdAndUpdate(
        req.params.id,
        { $set: pick(req.body, fields) },
        { new: true, runValidators: true }
    ));
    res.json(user);
}));

// Find user role by id
router.get('/user-role/:id', verifyToken, asyncHandler(async (req, res) => {
    const user = await findUserOr404(userSchema.findById(req.params.id));
    res.json(user.role);
}));

// Find user role by username
router.get('/usern-role/:username', verifyToken, asyncHandler(async (req, res) => {
    const user = await findUserOr404(userSchema.findOne({ username: String(req.params.username) }));
    res.json(user.role);
}));

// Delete User : son propre compte, ou n'importe lequel pour l'admin
router.delete('/delete-user/:id', verifyToken, isSelfOr('admin'), asyncHandler(async (req, res) => {
    const user = await findUserOr404(userSchema.findByIdAndDelete(req.params.id));
    res.status(200).json({ msg: user });
}));

// Liste par rôle : tout utilisateur connecté peut lister les médecins,
// seuls les médecins et admins peuvent lister les patients.
router.get('/users-patients/:role', verifyToken, asyncHandler(async (req, res) => {
    const role = String(req.params.role);
    if (role !== 'doctor' && !hasRole(req.user, 'doctor', 'admin')) {
        throw new HttpError(403, 'Access denied');
    }
    res.json(await userSchema.find({ role }));
}));

module.exports = router;
