const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Product name
  name: {
    type: String,
    required: [true, 'Produktnavn er obligatorisk'],
    trim: true,
    maxlength: [200, 'Produktnavn kan ikke være mer enn 200 tegn']
  },

  // Description
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Beskrivelse kan ikke være lengre enn 2000 tegn']
  },

  // Price
  price: {
    type: Number,
    required: [true, 'Pris er obligatorisk'],
    min: [0, 'Pris kan ikke være negativ']
  },

  // Currency
  currency: {
    type: String,
    default: 'NOK',
    enum: ['NOK', 'EUR', 'GBP', 'USD']
  },

  // Product images (local file paths)
  images: [{
    type: String,
    trim: true
  }],

  // Category
  category: {
    type: String,
    trim: true,
    enum: ['book', 'merchandise', 'accessory', 'other'],
    default: 'other'
  },

  // Stock quantity
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Antall tilgjengelige kan ikke være negativt']
  },

  // Availability status
  isAvailable: {
    type: Boolean,
    default: true
  },

  // Related book (optional)
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    default: null
  }
}, {
  timestamps: true
});

// Index for querying by category and availability
productSchema.index({ category: 1, isAvailable: 1 });

// Virtual to check if product is in stock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Populate book details when querying
productSchema.pre(/^find/, function() {
  this.populate({
    path: 'book',
    select: 'title author coverImage'
  });
});

// Ensure virtuals are included in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
