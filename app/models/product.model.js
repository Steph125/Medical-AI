const mongoose = require("mongoose");

const Product = mongoose.model(
  "Product",
  new mongoose.Schema({
    name: {
      type: String,
      required: true,  // Nom du produit requis
      trim: true       // Suppression des espaces superflus
    },
    description: {
      type: String,
      required: true,  // Description requise
      trim: true
    },
    price: {
      type: Number,
      required: true,  // Prix requis
      min: 0           // Le prix doit être positif
    },
    countInStock: {
      type: Number,
      required: true,  // Quantité en stock requise
      min: 0           // La quantité en stock doit être positive ou zéro
    },
    imageUrl: {
      type: String,
      required: true,  // URL de l'image requise
      trim: true
    },
    dateCreated: {
      type: Date,
      default: Date.now // Date de création par défaut
    }
  })
);

module.exports = Product;
