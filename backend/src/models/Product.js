const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Product name
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },

  // Description
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },

  // Price
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },

  // Currency
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP']
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
    min: [0, 'Stock cannot be negative']
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
