const express = require('express');

const blogSchema = require('../models/blog.model');
const { verifyToken, isDoctorOrAdmin, hasRole } = require('../middlewares/authJwt');
const { upload, requireFile, publicUrl } = require('../middlewares/upload');
const { HttpError, asyncHandler, pick, escapeRegex } = require('../utils/http');
const webmd = require('../services/webmd');

const router = express.Router();

const BLOG_FIELDS = ['title', 'description', 'category'];

// Seuls les auteurs du blog (ou un admin) peuvent le modifier ou le supprimer.
const findOwnBlog = async (req) => {
  const blog = await blogSchema.findById(req.params.id);
  if (!blog) throw new HttpError(404, 'Blog not found');
  const isAuthor = blog.doctors.some((id) => id.equals(req.userId));
  if (!isAuthor && !hasRole(req.user, 'admin')) throw new HttpError(403, 'Access denied');
  return blog;
};

router.post('/create-blog', verifyToken, isDoctorOrAdmin, upload.single('profileImg'), requireFile,
  asyncHandler(async (req, res) => {
    const isAdmin = hasRole(req.user, 'admin');
    await blogSchema.create({
      ...pick(req.body, BLOG_FIELDS),
      // L'auteur est le médecin connecté (un admin peut publier pour un autre médecin).
      doctors: isAdmin && req.body.doctors ? req.body.doctors : [req.userId],
      picture: publicUrl(req, req.file),
    });
    res.status(201).json({ message: "Blog registered successfully!" });
  }));

// READ Blog
router.get('/', asyncHandler(async (req, res) => {
  res.json(await blogSchema.find());
}));

// Get Single Blog
router.get('/blog/:id', asyncHandler(async (req, res) => {
  res.json(await blogSchema.findById(req.params.id));
}));

// Get Doctor Blogs
router.get('/blog-doctor/:doctors', asyncHandler(async (req, res) => {
  res.json(await blogSchema.find({ doctors: req.params.doctors }));
}));

// Update Blog
router.put('/update-blog/:id', verifyToken, asyncHandler(async (req, res) => {
  await findOwnBlog(req);
  const blog = await blogSchema.findByIdAndUpdate(req.params.id, { $set: pick(req.body, BLOG_FIELDS) }, { new: true });
  res.json(blog);
}));

// Compteurs publics (remplacent la modification de views/likes via update-blog)
router.put('/like/:id', asyncHandler(async (req, res) => {
  res.json(await blogSchema.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true }));
}));
router.put('/view/:id', asyncHandler(async (req, res) => {
  res.json(await blogSchema.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true }));
}));

// Delete Blog
router.delete('/delete-blog/:id', verifyToken, asyncHandler(async (req, res) => {
  const blog = await findOwnBlog(req);
  await blog.deleteOne();
  res.status(200).json({ msg: blog });
}));

router.get('/test', asyncHandler(async (req, res) => {
  res.json(await webmd.doctorsBlogPosts());
}));

// Le texte est échappé : sinon une regex piégée peut bloquer la base (ReDoS).
router.get('/search-blog/:text', asyncHandler(async (req, res) => {
  const pattern = new RegExp(escapeRegex(req.params.text), 'i');
  res.json(await blogSchema.find({ $or: [{ title: pattern }, { description: pattern }] }));
}));

router.get('/filter-blog/:text', asyncHandler(async (req, res) => {
  res.json(await blogSchema.find({ category: new RegExp(escapeRegex(req.params.text), 'i') }));
}));

router.get('/categories', asyncHandler(async (req, res) => {
  res.json(await blogSchema.distinct('category'));
}));

router.get('/search/:tag', asyncHandler(async (req, res) => {
  res.json(await webmd.searchArticles(req.params.tag));
}));

module.exports = router;
