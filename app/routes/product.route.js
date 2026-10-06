const express = require('express');

const productSchema = require('../models/product.model');
const { verifyToken, isAdmin } = require('../middlewares/authJwt');
const { HttpError, asyncHandler, pick } = require('../utils/http');

const router = express.Router();

const PRODUCT_FIELDS = ['name', 'description', 'price', 'countInStock', 'imageUrl'];

// CREATE Product (admin)
router.post('/create-product', verifyToken, isAdmin, asyncHandler(async (req, res) => {
    res.json(await productSchema.create(pick(req.body, PRODUCT_FIELDS)));
}));

// READ Products
router.get('/', asyncHandler(async (req, res) => {
    res.json(await productSchema.find());
}));

// Get Single Product
router.get('/edit-product/:id', asyncHandler(async (req, res) => {
    res.json(await productSchema.findById(req.params.id));
}));

// Update Product (admin)
router.put('/update-product/:id', verifyToken, isAdmin, asyncHandler(async (req, res) => {
    const product = await productSchema.findByIdAndUpdate(
        req.params.id,
        { $set: pick(req.body, PRODUCT_FIELDS) },
        { new: true, runValidators: true }
    );
    if (!product) throw new HttpError(404, 'Product not found');
    res.json(product);
}));

// Delete Product (admin)
router.delete('/delete-product/:id', verifyToken, isAdmin, asyncHandler(async (req, res) => {
    const product = await productSchema.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: product });
}));

module.exports = router;
