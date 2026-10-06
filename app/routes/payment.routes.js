const express = require('express');
const Stripe = require('stripe');

const Product = require('../models/product.model');
const { verifyToken } = require('../middlewares/authJwt');
const { HttpError, asyncHandler } = require('../utils/http');

const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

router.get('/', (req, res) => {
  res.send({ message: 'Stripe Checkout server!', timestamp: new Date().toISOString() });
});

// Le montant est calculé côté serveur à partir du produit : le client ne choisit plus le prix.
// Corps attendu : { source, productId, quantity }
router.post('/', verifyToken, asyncHandler(async (req, res) => {
  if (!stripe) throw new HttpError(503, 'Stripe is not configured (STRIPE_SECRET_KEY)');

  const { source, productId } = req.body;
  const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);
  if (!source || !productId) throw new HttpError(400, 'source and productId are required');

  const product = await Product.findById(productId);
  if (!product) throw new HttpError(404, 'Product not found');
  if (product.countInStock < quantity) throw new HttpError(400, 'Not enough stock');

  const charge = await stripe.charges.create({
    amount: Math.round(product.price * 100) * quantity,
    currency: process.env.STRIPE_CURRENCY || 'eur',
    source: String(source),
    description: `${product.name} x${quantity}`,
    metadata: { userId: req.userId, productId: product.id },
  });
  await Product.updateOne(
    { _id: product._id, countInStock: { $gte: quantity } },
    { $inc: { countInStock: -quantity } }
  );
  res.status(200).send({ success: charge });
}));

module.exports = router;
