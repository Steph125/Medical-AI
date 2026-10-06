const Record = require('../models/Record.js')
const { hasRole } = require('../middlewares/authJwt')
const { HttpError, asyncHandler, pick } = require('../utils/http')

const RECORD_FIELDS = [
    'probActive', 'ancienProb', 'resLabo', 'familiale', 'resImg', 'style',
    'notes', 'prescripton', 'allergie', 'medication',
]

const isStaff = (user) => hasRole(user, 'doctor', 'admin')

//add record
const record_Create_Post = asyncHandler(async(req, res) => {
    let userid = [].concat(req.body.userid || []).map(String)
    if (!isStaff(req.user)) {
        // Un patient ne peut créer qu'un dossier à son propre nom.
        if (userid.some((id) => id !== req.userId)) {
            throw new HttpError(403, 'Access denied')
        }
        userid = [req.userId]
    }
    const record = await Record.create({ ...pick(req.body, RECORD_FIELDS), userid })
    res.status(201).json({ Record: record })
})

//update record (id = id de l'utilisateur)
const record_update = asyncHandler(async(req, res) => {
    const record = await Record.findOneAndUpdate(
        { userid: req.params.id },
        { $set: pick(req.body, RECORD_FIELDS) },
        { new: true, runValidators: true }
    )
    res.json(record)
})

//delete record (id = id du dossier)
const record_delete = asyncHandler(async(req, res) => {
    const record = await Record.findById(req.params.id)
    if (!record) {
        throw new HttpError(404, 'Record not found')
    }
    if (!isStaff(req.user) && !record.userid.some((id) => id.equals(req.userId))) {
        throw new HttpError(403, 'Access denied')
    }
    await record.deleteOne()
    res.json()
})

// détails (id = id de l'utilisateur)
const record_details = asyncHandler(async(req, res) => {
    res.json(await Record.find({ userid: req.params.id }))
})

const record_list = asyncHandler(async(req, res) => {
    res.json(await Record.find().sort({ createdAt: -1 }))
})

module.exports = {
    record_Create_Post,
    record_delete,
    record_update,
    record_details,
    record_list
}
